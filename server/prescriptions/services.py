# prescriptions/services.py
import os
import json
import anthropic
from dotenv import load_dotenv

load_dotenv()

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

# Toggle for local testing without API credits
USE_MOCK = os.getenv("USE_MOCK_AI", "False") == "True"


def normalize_combination(drugs):
    names = sorted([f"{d['name'].strip().lower()}_{d['dosage'].strip().lower()}" for d in drugs])
    return "|".join(names)


def build_prompt(drugs):
    drug_list = "\n".join([f"- {d['name']} ({d['dosage']})" for d in drugs])

    return f"""You are a clinical pharmacist assistant reviewing a prescription before it is dispensed.

Medications prescribed:
{drug_list}

Check for clinically significant drug-drug interactions between these medications.

Respond ONLY with valid JSON, no markdown formatting, in this exact structure:
{{
  "has_interaction": true or false,
  "severity": "None" or "Mild" or "Moderate" or "Severe",
  "interactions": ["short description of each interaction found"],
  "recommendation": "one or two sentence clinical recommendation for the pharmacist"
}}

If no significant interactions exist, return has_interaction: false, severity: "None", interactions: [], and a brief recommendation confirming it's safe to dispense."""


def mock_response(drugs):
    """Fake Claude response for local testing without API credits."""
    drug_names = [d["name"].lower() for d in drugs]

    # A couple of hardcoded "realistic" scenarios for demo purposes
    if "metformin" in drug_names and "lisinopril" in drug_names:
        return {
            "has_interaction": True,
            "severity": "Mild",
            "interactions": [
                "Lisinopril may slightly enhance the blood-sugar-lowering effect of Metformin."
            ],
            "recommendation": "Monitor blood glucose levels periodically. No dose adjustment usually required.",
            "cached": False,
        }

    if "warfarin" in drug_names and "aspirin" in drug_names:
        return {
            "has_interaction": True,
            "severity": "Severe",
            "interactions": [
                "Combining Warfarin with Aspirin significantly increases the risk of bleeding."
            ],
            "recommendation": "Avoid this combination if possible. If necessary, monitor INR closely and watch for signs of bleeding.",
            "cached": False,
        }

    # Default — no known interaction in our mock dataset
    return {
        "has_interaction": False,
        "severity": "None",
        "interactions": [],
        "recommendation": "No significant interactions found between the listed medications.",
        "cached": False,
    }


def check_interactions(drugs):
    if len(drugs) < 2:
        return {
            "has_interaction": False,
            "severity": "None",
            "interactions": [],
            "recommendation": "Only one medication prescribed — no interaction check needed.",
            "cached": False,
        }

    from .models import InteractionCache

    combo_key = normalize_combination(drugs)

    cached = InteractionCache.objects.filter(drug_combination=combo_key).first()
    if cached:
        result = cached.result
        result["cached"] = True
        return result

    # ── MOCK MODE ──────────────────────────────────────
    if USE_MOCK:
        result = mock_response(drugs)
        InteractionCache.objects.create(drug_combination=combo_key, result=result)
        return result
    # ─────────────────────────────────────────────────────

    try:
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=500,
            messages=[{"role": "user", "content": build_prompt(drugs)}],
        )

        result_text = response.content[0].text.strip()
        result_text = result_text.replace("```json", "").replace("```", "").strip()

        result = json.loads(result_text)
        result["cached"] = False

        InteractionCache.objects.create(drug_combination=combo_key, result=result)
        return result

    except anthropic.APIError as e:
        return {"error": True, "message": f"Claude API error: {str(e)}"}
    except json.JSONDecodeError:
        return {"error": True, "message": "Could not parse AI response. Please try again."}
    except Exception as e:
        return {"error": True, "message": f"Unexpected error: {str(e)}"}