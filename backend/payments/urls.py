from django.urls import path

from checkout.views import PurchaseListView

urlpatterns = [
    path("purchases", PurchaseListView.as_view()),
]
