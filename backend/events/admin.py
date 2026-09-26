from django.contrib import admin

from events.models import Event


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ("event_type", "customer", "movie", "timestamp", "n8n_status")
    list_filter = ("event_type", "n8n_status")
    search_fields = ("customer__email", "customer_ref", "movie__title", "checkout_ref")
    readonly_fields = ("id", "created_at", "metadata")
