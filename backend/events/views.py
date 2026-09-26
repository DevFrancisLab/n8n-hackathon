from django.core.exceptions import ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from checkout.models import Checkout
from events.serializers import EventSerializer, EventWriteSerializer
from events.services import parse_timestamp, record_event
from movies.models import Movie


def _checkout_or_none(value):
    try:
        return Checkout.objects.filter(pk=value).select_related("customer").first()
    except (ValueError, ValidationError):
        return None


class EventListCreateView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = EventWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        movie = None
        movie_ref = (data.get("movie_id") or "").strip()
        if movie_ref:
            movie = Movie.objects.filter(pk=movie_ref).first()
            if movie is None:
                return Response(
                    {"error": "Movie not found", "detail": "Movie not found"},
                    status=404,
                )

        checkout = None
        checkout_ref = (data.get("checkout_id") or "").strip()
        if checkout_ref:
            checkout = _checkout_or_none(checkout_ref)
            if checkout is not None:
                if request.user.is_authenticated and checkout.customer_id != request.user.pk:
                    return Response(
                        {"error": "Checkout not found", "detail": "Checkout not found"},
                        status=404,
                    )
                if not request.user.is_authenticated:
                    checkout = None

        customer = request.user if request.user.is_authenticated else None
        customer_ref = ""
        if customer is None:
            customer_ref = (data.get("customer_id") or "").strip()

        metadata = data.get("metadata") or {}
        if not isinstance(metadata, dict):
            return Response({"error": "Invalid request.", "detail": "Invalid request."}, status=400)

        event, n8n = record_event(
            event_type=data["event"],
            customer=customer,
            customer_ref=customer_ref,
            movie=movie,
            movie_ref="" if movie else movie_ref,
            checkout=checkout,
            checkout_ref="" if checkout else checkout_ref,
            timestamp=parse_timestamp(data.get("timestamp")),
            metadata=metadata,
            client_event_id=(data.get("id") or "").strip() or None,
        )
        body = EventSerializer(event).data
        body["saved"] = True
        body["n8n"] = n8n
        return Response(body, status=201)
