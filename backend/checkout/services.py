from django.core.exceptions import ValidationError
from django.db import transaction

from checkout.models import Checkout
from config.money import money
from events.models import Event
from events.services import record_event
from payments.models import Payment, Purchase

DEMO_DECLINE = "Demo decline. No charge was made."


def _display_name(checkout):
    return checkout.name or checkout.customer.name or "Guest"


def _base_metadata(checkout):
    return {
        "amount": money(checkout.amount),
        "movie_title": checkout.movie.title,
        "display_name": _display_name(checkout),
    }


def get_or_start(user, movie, *, name="", email="", phone="", payment_method="mpesa", force_new=False):
    latest = (
        Checkout.objects.filter(customer=user, movie=movie)
        .select_related("movie", "customer")
        .order_by("created_at")
        .last()
    )
    if latest and not force_new:
        latest.name = name or latest.name
        latest.email = email or latest.email
        latest.phone = phone or latest.phone
        if latest.status == Checkout.Status.ABANDONED:
            latest.status = Checkout.Status.STARTED
        latest.save()
        return latest, []

    method = payment_method if payment_method in Checkout.Method.values else Checkout.Method.MPESA
    checkout = Checkout.objects.create(
        customer=user,
        movie=movie,
        name=name or user.name,
        email=email or user.email,
        phone=phone or user.phone,
        payment_method=method,
        amount=movie.price,
        status=Checkout.Status.STARTED,
    )
    event, _n8n = record_event(
        event_type=Event.Type.CHECKOUT_STARTED,
        customer=user,
        movie=movie,
        checkout=checkout,
        metadata=_base_metadata(checkout),
    )
    return checkout, [event]


def save_details(checkout, *, name, email, phone, payment_method):
    checkout.name = name
    checkout.email = email
    checkout.phone = phone
    if payment_method in Checkout.Method.values:
        checkout.payment_method = payment_method
    if checkout.status not in {Checkout.Status.PAID, Checkout.Status.COMPLETED}:
        checkout.status = Checkout.Status.PAYMENT_PENDING
    checkout.save()
    return checkout


def abandon(checkout):
    if checkout.status in {Checkout.Status.PAID, Checkout.Status.COMPLETED}:
        raise ValidationError("This checkout is already paid.")
    if checkout.status == Checkout.Status.ABANDONED:
        return checkout, []
    checkout.status = Checkout.Status.ABANDONED
    checkout.save(update_fields=["status", "updated_at"])
    event, _n8n = record_event(
        event_type=Event.Type.CHECKOUT_ABANDONED,
        customer=checkout.customer,
        movie=checkout.movie,
        checkout=checkout,
        metadata=_base_metadata(checkout),
    )
    return checkout, [event]


def _was_abandoned(checkout):
    return Event.objects.filter(
        event_type=Event.Type.CHECKOUT_ABANDONED,
        customer=checkout.customer,
        movie=checkout.movie,
    ).exists()


@transaction.atomic
def complete_payment(checkout, method):
    existing = Purchase.objects.filter(checkout=checkout).first()
    if checkout.status in {Checkout.Status.PAID, Checkout.Status.COMPLETED} and existing:
        return existing, []

    if method not in Payment.Method.values:
        method = checkout.payment_method

    Payment.objects.create(
        checkout=checkout,
        payment_method=method,
        status=Payment.Status.SUCCESS,
    )
    checkout.payment_method = method
    checkout.status = Checkout.Status.PAID
    checkout.save(update_fields=["payment_method", "status", "updated_at"])

    purchase = Purchase.objects.create(
        customer=checkout.customer,
        checkout=checkout,
        movie=checkout.movie,
        amount=checkout.amount,
        payment_method=method,
        status=Purchase.Status.COMPLETED,
    )
    shared = {
        **_base_metadata(checkout),
        "payment_method": method,
    }
    payment_event, _n8n = record_event(
        event_type=Event.Type.PAYMENT_COMPLETED,
        customer=checkout.customer,
        movie=checkout.movie,
        checkout=checkout,
        metadata=shared,
    )
    purchase_event, _n8n = record_event(
        event_type=Event.Type.PURCHASE_COMPLETED,
        customer=checkout.customer,
        movie=checkout.movie,
        checkout=checkout,
        metadata={**shared, "recovered": _was_abandoned(checkout)},
    )
    return purchase, [payment_event, purchase_event]


@transaction.atomic
def fail_payment(checkout, method, failure_reason=DEMO_DECLINE):
    if method not in Payment.Method.values:
        method = checkout.payment_method
    reason = failure_reason or DEMO_DECLINE
    Payment.objects.create(
        checkout=checkout,
        payment_method=method,
        status=Payment.Status.FAILED,
        failure_reason=reason,
    )
    checkout.payment_method = method
    checkout.status = Checkout.Status.PAYMENT_FAILED
    checkout.save(update_fields=["payment_method", "status", "updated_at"])
    event, _n8n = record_event(
        event_type=Event.Type.PAYMENT_FAILED,
        customer=checkout.customer,
        movie=checkout.movie,
        checkout=checkout,
        metadata={
            **_base_metadata(checkout),
            "payment_method": method,
            "failure_reason": reason,
            "checkout_id": str(checkout.id),
            "customer_id": str(checkout.customer_id),
            "movie_id": checkout.movie_id,
        },
    )
    return checkout, [event]
