import logging
from datetime import datetime

from django.conf import settings
from django.utils import timezone
from django.utils.dateparse import parse_datetime
import requests

from config.money import money
from config.time import isoformat
from events.models import Event

logger = logging.getLogger("events")


def parse_timestamp(value):
    if not value:
        return timezone.now()
    if isinstance(value, datetime):
        parsed = value
    else:
        parsed = parse_datetime(str(value))
    if parsed is None:
        return timezone.now()
    if timezone.is_naive(parsed):
        return timezone.make_aware(parsed, datetime.now().astimezone().tzinfo)
    return parsed


def event_payload(event):
    customer_id = str(event.customer_id) if event.customer_id else event.customer_ref or None
    movie_id = event.movie_id or event.movie_ref or None
    checkout_id = str(event.checkout_id) if event.checkout_id else event.checkout_ref or None
    payload = {
        "id": event.client_event_id or str(event.id),
        "event": event.event_type,
        "timestamp": isoformat(event.timestamp),
        "metadata": event.metadata or {},
    }
    if customer_id:
        payload["customer_id"] = customer_id
    if movie_id:
        payload["movie_id"] = movie_id
    if checkout_id:
        payload["checkout_id"] = checkout_id
    return payload


def build_n8n_payload(event):
    loaded = (
        Event.objects.select_related("customer", "movie", "checkout", "checkout__movie")
        .get(pk=event.pk)
    )
    payload = {
        "event_id": str(loaded.id),
        "event_type": loaded.event_type,
        "timestamp": isoformat(loaded.timestamp),
        "metadata": loaded.metadata or {},
    }
    if loaded.customer_id:
        payload["customer"] = {
            "id": str(loaded.customer_id),
            "name": loaded.customer.name,
            "email": loaded.customer.email,
            "phone": loaded.customer.phone,
        }
    elif loaded.customer_ref:
        payload["customer"] = {"id": loaded.customer_ref}
    if loaded.movie_id:
        payload["movie"] = {
            "id": loaded.movie_id,
            "title": loaded.movie.title,
            "genre": loaded.movie.genre,
            "country": loaded.movie.country,
            "price": money(loaded.movie.price),
        }
    if loaded.checkout_id:
        payload["checkout"] = {
            "id": str(loaded.checkout_id),
            "status": loaded.checkout.status,
            "amount": money(loaded.checkout.amount),
        }
    return payload


def forward_event_to_n8n(event):
    url = settings.N8N_WEBHOOK_URL
    if not url:
        logger.info("n8n forwarding is not configured")
        event.n8n_status = Event.ForwardStatus.NOT_CONFIGURED
        event.save(update_fields=["n8n_status"])
        return {"forwarded": False, "status": "not_configured"}

    headers = {"Accept": "application/json", "Content-Type": "application/json"}
    secret = settings.N8N_WEBHOOK_SECRET
    if secret:
        headers["X-YakWetu-Webhook-Secret"] = secret

    try:
        response = requests.post(url, json=build_n8n_payload(event), headers=headers, timeout=5)
    except requests.RequestException:
        logger.warning("n8n webhook is unavailable")
        event.n8n_status = Event.ForwardStatus.FAILED
        event.save(update_fields=["n8n_status"])
        return {"forwarded": False, "status": "unavailable"}

    if response.ok:
        event.n8n_status = Event.ForwardStatus.FORWARDED
        event.save(update_fields=["n8n_status"])
        return {"forwarded": True, "status": "forwarded"}

    logger.warning("n8n webhook returned HTTP %s", response.status_code)
    event.n8n_status = Event.ForwardStatus.FAILED
    event.save(update_fields=["n8n_status"])
    return {"forwarded": False, "status": "failed"}


def record_event(
    *,
    event_type,
    customer=None,
    customer_ref="",
    movie=None,
    movie_ref="",
    checkout=None,
    checkout_ref="",
    timestamp=None,
    metadata=None,
    client_event_id=None,
):
    if client_event_id:
        existing = Event.objects.filter(client_event_id=client_event_id).first()
        if existing:
            return existing, {"forwarded": False, "status": "duplicate"}

    event = Event.objects.create(
        client_event_id=client_event_id or None,
        event_type=event_type,
        customer=customer,
        customer_ref=customer_ref or "",
        movie=movie,
        movie_ref=movie_ref or "",
        checkout=checkout,
        checkout_ref=checkout_ref or "",
        timestamp=timestamp or timezone.now(),
        metadata=metadata or {},
    )
    return event, forward_event_to_n8n(event)


def activity_for_user(user):
    return Event.objects.filter(customer=user).select_related("movie", "checkout")
