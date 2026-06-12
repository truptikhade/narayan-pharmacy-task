# prescriptions/serializers.py
from rest_framework import serializers
from .models import Prescription, Drug


class DrugSerializer(serializers.ModelSerializer):
    class Meta:
        model = Drug
        fields = ["id", "name", "dosage"]


class PrescriptionListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for the list view."""
    drug_count = serializers.SerializerMethodField()

    class Meta:
        model = Prescription
        fields = ["id", "patient_name", "doctor_name", "date", "severity", "drug_count", "created_at"]

    def get_drug_count(self, obj):
        return obj.drugs.count()


class PrescriptionDetailSerializer(serializers.ModelSerializer):
    """Full serializer with nested drugs — used for detail view and creation."""
    drugs = DrugSerializer(many=True)

    class Meta:
        model = Prescription
        fields = [
            "id", "patient_name", "doctor_name", "date",
            "drugs", "interaction_result", "severity", "created_at"
        ]

    def create(self, validated_data):
        drugs_data = validated_data.pop("drugs")
        prescription = Prescription.objects.create(**validated_data)
        for drug in drugs_data:
            Drug.objects.create(prescription=prescription, **drug)
        return prescription