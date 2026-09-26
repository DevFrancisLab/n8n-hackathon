import uuid

from django.db import models


class Event(models.Model):
    class Type(models.TextChoices):
        SIGNUP_COMPLETED = "SIGNUP_COMPLETED"
        MOVIE_VIEWED = "MOVIE_VIEWED"
        SEARCH_PERFORMED = "SEARCH_PERFORMED"
        ADD_TO_CART = "ADD_TO_CART"
        CHECKOUT_STARTED = "CHECKOUT_STARTED"
        CHECKOUT_ABANDONED = "CHECKOUT_ABANDONED"
        PAYMENT_FAILED = "PAYMENT_FAILED"
        PAYMENT_COMPLETED = "PAYMENT_COMPLETED"
        PURCHASE_COMPLETED = "PURCHASE_COMPLETED"
        WATCH_COMPLETED = "WATCH_COMPLETED"
        CONCIERGE_REQUESTED = "CONCIERGE_REQUESTED"
        RECOMMENDATION_VIEWED = "RECOMMENDATION_VIEWED"
        RECOMMENDATION_CLICKED = "RECOMMENDATION_CLICKED"

    class ForwardStatus(models.TextChoices):
        PENDING = "pending"
        NOT_CONFIGURED = "not_configured"
        FORWARDED = "forwarded"
        FAILED = "failed"
        DUPLICATE = "duplicate"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    client_event_id = models.CharField(max_length=80, unique=True, null=True, blank=True)
    event_type = models.CharField(max_length=40, choices=Type.choices)
    customer = models.ForeignKey(
        "accounts.User",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="events",
    )
    customer_ref = models.CharField(max_length=80, blank=True)
    movie = models.ForeignKey(
        "movies.Movie",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="events",
    )
    movie_ref = models.CharField(max_length=80, blank=True)
    checkout = models.ForeignKey(
        "checkout.Checkout",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="events",
    )
    checkout_ref = models.CharField(max_length=80, blank=True)
    timestamp = models.DateTimeField()
    metadata = models.JSONField(default=dict, blank=True)
    n8n_status = models.CharField(max_length=20, choices=ForwardStatus.choices, default=ForwardStatus.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-timestamp", "-created_at"]
        indexes = [
            models.Index(fields=["event_type", "timestamp"]),
            models.Index(fields=["customer", "timestamp"]),
        ]

    def __str__(self):
        return f"{self.event_type} {self.timestamp.isoformat()}"
