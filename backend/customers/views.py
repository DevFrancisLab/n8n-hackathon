from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User
from events.serializers import EventSerializer
from events.services import activity_for_user


class ActivityView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, customer_id=None):
        target = request.user
        if customer_id is not None and customer_id != request.user.pk:
            if not request.user.is_staff:
                return Response(
                    {
                        "error": "You cannot view another customer's activity.",
                        "detail": "You cannot view another customer's activity.",
                    },
                    status=403,
                )
            target = User.objects.filter(pk=customer_id).first()
            if target is None:
                return Response({"error": "Customer not found", "detail": "Customer not found"}, status=404)
        events = activity_for_user(target)
        return Response({"results": EventSerializer(events, many=True).data})
