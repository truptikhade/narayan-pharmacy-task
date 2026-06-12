from django.db import models


class Prescription(models.Model):
    patient_name = models.CharField(max_length=200)
    doctor_name = models.CharField(max_length=200)
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    interaction_result = models.JSONField(null=True, blank=True)
    severity = models.CharField(
        max_length=20,
        choices=[
            ("None", "None"),
            ("Mild", "Mild"),
            ("Moderate", "Moderate"),
            ("Severe", "Severe"),
        ],
        default="None",
    )

    def __str__(self):
        return f"{self.patient_name} - {self.date}"


class Drug(models.Model):
    prescription = models.ForeignKey(
        Prescription, related_name="drugs", on_delete=models.CASCADE
    )
    name = models.CharField(max_length=200)
    dosage = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.name} ({self.dosage})"


class InteractionCache(models.Model):
    """Caches AI results for a given drug combination so we don't re-call the API."""
    drug_combination = models.CharField(max_length=500, unique=True, db_index=True)
    result = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.drug_combination