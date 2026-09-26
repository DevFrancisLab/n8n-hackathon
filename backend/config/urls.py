from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.urls")),
    path("api/", include("movies.urls")),
    path("api/", include("events.urls")),
    path("api/", include("checkout.urls")),
    path("api/", include("payments.urls")),
    path("api/", include("concierge.urls")),
    path("api/", include("customers.urls")),
]
