from django.urls import path

from customers.views import ActivityView

urlpatterns = [
    path("customers/me/activity", ActivityView.as_view()),
    path("customers/<int:customer_id>/activity", ActivityView.as_view()),
]
