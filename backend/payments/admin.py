from django.contrib import admin

from payments.models import Payment, Purchase


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("checkout", "payment_method", "status", "created_at")
    list_filter = ("status", "payment_method")
    search_fields = ("failure_reason", "checkout__customer__email")


@admin.register(Purchase)
class PurchaseAdmin(admin.ModelAdmin):
    list_display = ("customer", "movie", "amount", "status", "created_at")
    list_filter = ("status", "payment_method")
    search_fields = ("customer__email", "movie__title")
