from django.contrib import admin

from checkout.models import Checkout


@admin.register(Checkout)
class CheckoutAdmin(admin.ModelAdmin):
    list_display = ("customer", "movie", "status", "amount", "created_at")
    list_filter = ("status", "payment_method")
    search_fields = ("customer__email", "movie__title")
