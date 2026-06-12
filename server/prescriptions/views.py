from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Prescription
from .serializers import PrescriptionListSerializer, PrescriptionDetailSerializer
from .services import check_interactions


@api_view(["GET", "POST"])
def prescription_list_create(request):
    if request.method == "GET":
        prescriptions = Prescription.objects.all().order_by("-created_at")
        serializer = PrescriptionListSerializer(prescriptions, many=True)
        return Response(serializer.data)

    if request.method == "POST":
        serializer = PrescriptionDetailSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        prescription = serializer.save()

        # Run interaction check
        drugs = [{"name": d.name, "dosage": d.dosage} for d in prescription.drugs.all()]
        result = check_interactions(drugs)

        if result.get("error"):
            # Save prescription anyway, but surface the error to the frontend
            return Response(
                {
                    "prescription": PrescriptionDetailSerializer(prescription).data,
                    "ai_error": result["message"],
                },
                status=status.HTTP_201_CREATED,
            )

        # Save AI result on the prescription
        prescription.interaction_result = result
        prescription.severity = result.get("severity", "None")
        prescription.save()

        return Response(
            PrescriptionDetailSerializer(prescription).data,
            status=status.HTTP_201_CREATED,
        )


@api_view(["GET"])
def prescription_detail(request, pk):
    try:
        prescription = Prescription.objects.get(pk=pk)
    except Prescription.DoesNotExist:
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

    serializer = PrescriptionDetailSerializer(prescription)
    return Response(serializer.data)