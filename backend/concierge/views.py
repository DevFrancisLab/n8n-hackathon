from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from concierge.services import recommend_for_prompt


class ConciergeView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        prompt = request.data.get("prompt") if isinstance(request.data, dict) else ""
        match = recommend_for_prompt(prompt if isinstance(prompt, str) else "")
        if match is None:
            return Response(
                {"error": "Tell YakWetu what you want to watch.", "detail": "Tell YakWetu what you want to watch."},
                status=400,
            )
        return Response(match)
