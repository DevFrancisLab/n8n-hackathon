from django.apps import AppConfig


class CustomersConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "customers"

    def ready(self):
        from django.db.models.signals import post_save

        from accounts.models import User
        from customers.models import CustomerProfile

        def create_profile(sender, instance, created, **kwargs):
            if created:
                CustomerProfile.objects.get_or_create(user=instance)

        post_save.connect(create_profile, sender=User, dispatch_uid="customers.create_profile")
