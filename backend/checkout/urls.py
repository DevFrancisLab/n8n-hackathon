from django.urls import path

from checkout.views import AbandonCheckoutView, CheckoutCollectionView, CheckoutDetailView, PayCheckoutView

urlpatterns = [
    path("checkouts", CheckoutCollectionView.as_view()),
    path("checkouts/<uuid:checkout_id>", CheckoutDetailView.as_view()),
    path("checkouts/<uuid:checkout_id>/abandon", AbandonCheckoutView.as_view()),
    path("checkouts/<uuid:checkout_id>/pay", PayCheckoutView.as_view()),
]
