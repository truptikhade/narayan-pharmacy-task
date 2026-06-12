# prescriptions/services.py
import os
import json
import anthropic
from dotenv import load_dotenv

load_dotenv()

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


def normalize_combination(drugs):
    """Create a consistent key for caching, regardless of order."""
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


def check_interactions(drugs):
    # Edge case: only 1 drug — skip API call entirely
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

    # Check cache first
    cached = InteractionCache.objects.filter(drug_combination=combo_key).first()
    if cached:
        result = cached.result
        result["cached"] = True
        return result

    # Call Claude API
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

        # Save to cache
        InteractionCache.objects.create(drug_combination=combo_key, result=result)

        return result

    except anthropic.APIError as e:
        return {"error": True, "message": f"Claude API error: {str(e)}"}
    except json.JSONDecodeError:
        return {"error": True, "message": "Could not parse AI response. Please try again."}
    except Exception as e:
        return {"error": True, "message": f"Unexpected error: {str(e)}"}