from django.db import models


class Movie(models.Model):
    id = models.SlugField(primary_key=True, max_length=80)
    title = models.CharField(max_length=200)
    overview = models.TextField()
    genre = models.CharField(max_length=32)
    country = models.CharField(max_length=80)
    language = models.CharField(max_length=80)
    year = models.PositiveIntegerField()
    duration = models.PositiveIntegerField(help_text="Runtime in minutes")
    price = models.DecimalField(max_digits=10, decimal_places=2)
    poster = models.CharField(max_length=255)
    backdrop = models.CharField(max_length=255)
    palette = models.JSONField(default=dict)
    motif = models.PositiveSmallIntegerField(default=0)
    tags = models.JSONField(default=list)
    featured = models.BooleanField(default=False)
    trending_rank = models.PositiveIntegerField(null=True, blank=True)
    demo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["title"]

    def __str__(self):
        return self.title


class WatchHistory(models.Model):
    customer = models.ForeignKey("accounts.User", on_delete=models.CASCADE, related_name="watches")
    movie = models.ForeignKey(Movie, on_delete=models.PROTECT, related_name="watches")
    purchase = models.ForeignKey("payments.Purchase", on_delete=models.PROTECT, related_name="watches")
    watched_at = models.DateTimeField(auto_now_add=True)
    completed = models.BooleanField(default=True)

    class Meta:
        ordering = ["-watched_at"]
        verbose_name_plural = "watch history"

    def __str__(self):
        return f"{self.customer.email} watched {self.movie_id}"
