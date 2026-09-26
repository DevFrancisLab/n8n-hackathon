import uuid

from django.db import models


class Checkout(models.Model):
    class Status(models.TextChoices):
        STARTED = "started", "Started"
        ABANDONED = "abandoned", "Abandoned"
        PAYMENT_PENDING = "payment_pending", "Payment pending"
        PAYMENT_FAILED = "failed", "Payment failed"
        PAID = "paid", "Paid"
        COMPLETED = "completed", "Completed"

    class Method(models.TextChoices):
        MPESA = "mpesa", "M-Pesa"
        CARD = "card", "Card"
        OTHER = "other", "Other"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer = models.ForeignKey("accounts.User", on_delete=models.CASCADE, related_name="checkouts")
    movie = models.ForeignKey("movies.Movie", on_delete=models.PROTECT, related_name="checkouts")
    name = models.CharField(max_length=80, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=32, choices=Status.choices, default=Status.STARTED)
    payment_method = models.CharField(max_length=16, choices=Method.choices, default=Method.MPESA)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.customer.email} · {self.movie_id} · {self.status}"
