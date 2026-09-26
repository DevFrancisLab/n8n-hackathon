from django.core.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from checkout.models import Checkout
from checkout.payloads import checkout_payload, purchase_payload, with_events
from checkout.services import abandon, complete_payment, fail_payment, get_or_start, save_details
from movies.models import Movie


def _text(data, *keys, default=""):
    for key in keys:
        value = data.get(key)
        if isinstance(value, str):
            return value.strip()
    return default


def _owned_checkout(user, checkout_id):
    checkout = Checkout.objects.filter(pk=checkout_id).select_related("movie", "customer").first()
    if checkout is None:
        return None
    if checkout.customer_id != user.pk:
        return "forbidden"
    return checkout


class CheckoutCollectionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        movie_id = request.query_params.get("movie_id") or request.query_params.get("movieId")
        queryset = Checkout.objects.filter(customer=request.user).select_related("movie")
        if movie_id:
            queryset = queryset.filter(movie_id=movie_id)
        checkout = queryset.order_by("created_at").last()
        return Response({"checkout": checkout_payload(checkout) if checkout else None})

    def post(self, request):
        movie_id = _text(request.data, "movie_id", "movieId")
        movie = Movie.objects.filter(pk=movie_id).first()
        if movie is None:
            return Response({"error": "Movie not found", "detail": "Movie not found"}, status=404)
        force_new = bool(request.data.get("force_new") or request.data.get("forceNew"))
        checkout, events = get_or_start(
            request.user,
            movie,
            name=_text(request.data, "name"),
            email=_text(request.data, "email"),
            phone=_text(request.data, "phone"),
            payment_method=_text(request.data, "payment_method", "paymentMethod", default="mpesa"),
            force_new=force_new,
        )
        body = checkout_payload(checkout)
        body["created"] = bool(events)
        return Response(with_events(body, events), status=201 if events else 200)


class CheckoutDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, checkout_id):
        checkout = _owned_checkout(request.user, checkout_id)
        if checkout is None:
            return Response({"error": "Checkout not found", "detail": "Checkout not found"}, status=404)
        if checkout == "forbidden":
            return Response({"error": "Checkout not found", "detail": "Checkout not found"}, status=404)
        return Response(checkout_payload(checkout))

    def patch(self, request, checkout_id):
        checkout = _owned_checkout(request.user, checkout_id)
        if checkout is None or checkout == "forbidden":
            return Response({"error": "Checkout not found", "detail": "Checkout not found"}, status=404)
        name = _text(request.data, "name", default=checkout.name)
        email = _text(request.data, "email", default=checkout.email)
        phone = _text(request.data, "phone", default=checkout.phone)
        method = _text(request.data, "payment_method", "paymentMethod", default=checkout.payment_method)
        if not name or not email or not phone:
            return Response({"error": "Invalid request.", "detail": "Invalid request."}, status=400)
        updated = save_details(checkout, name=name, email=email, phone=phone, payment_method=method)
        return Response(checkout_payload(updated))


class AbandonCheckoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, checkout_id):
        checkout = _owned_checkout(request.user, checkout_id)
        if checkout is None or checkout == "forbidden":
            return Response({"error": "Checkout not found", "detail": "Checkout not found"}, status=404)
        try:
            updated, events = abandon(checkout)
        except ValidationError as exc:
            message = exc.messages[0]
            return Response({"error": message, "detail": message}, status=400)
        return Response(with_events({"checkout": checkout_payload(updated)}, events))


class PayCheckoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, checkout_id):
        checkout = _owned_checkout(request.user, checkout_id)
        if checkout is None or checkout == "forbidden":
            return Response({"error": "Checkout not found", "detail": "Checkout not found"}, status=404)
        method = _text(request.data, "payment_method", "paymentMethod", default=checkout.payment_method)
        outcome = _text(request.data, "outcome", default="success")
        if outcome == "failed":
            updated, events = fail_payment(
                checkout,
                method,
                _text(request.data, "failure_reason", "failureReason"),
            )
            return Response(with_events({"checkout": checkout_payload(updated)}, events))
        if outcome != "success":
            return Response({"error": "Invalid request.", "detail": "Invalid request."}, status=400)
        purchase, events = complete_payment(checkout, method)
        return Response(
            with_events(
                {"purchase": purchase_payload(purchase), "checkout": checkout_payload(checkout)},
                events,
            )
        )


class PurchaseListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        purchases = request.user.purchases.select_related("movie").order_by("-created_at")
        return Response([purchase_payload(purchase) for purchase in purchases])
