from django.urls import path

from concierge.views import ConciergeView

urlpatterns = [
    path("concierge", ConciergeView.as_view()),
]
