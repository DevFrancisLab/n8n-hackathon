from django.db.models import Q
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from checkout.payloads import with_events
from events.models import Event
from events.services import record_event
from movies.models import Movie, WatchHistory
from movies.serializers import MovieSerializer
from payments.models import Purchase


class MovieListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        movies = Movie.objects.all()
        genre = request.query_params.get("genre")
        country = request.query_params.get("country")
        year = request.query_params.get("year")
        search = (request.query_params.get("search") or "").strip()
        if genre:
            movies = movies.filter(genre__iexact=genre)
        if country:
            movies = movies.filter(country__iexact=country)
        if year:
            movies = movies.filter(year=year)
        if search:
            movies = movies.filter(
                Q(title__icontains=search)
                | Q(overview__icontains=search)
                | Q(genre__icontains=search)
                | Q(country__icontains=search)
                | Q(language__icontains=search)
            )
        return Response(MovieSerializer(movies, many=True).data)


class MovieDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, movie_id):
        movie = Movie.objects.filter(pk=movie_id).first()
        if movie is None:
            return Response({"error": "Movie not found", "detail": "Movie not found"}, status=404)
        return Response(MovieSerializer(movie).data)


class WatchView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        movie_id = request.data.get("movieId") or request.data.get("movie_id")
        movie = Movie.objects.filter(pk=movie_id).first()
        if movie is None:
            return Response({"error": "Movie not found", "detail": "Movie not found"}, status=404)
        purchase = (
            Purchase.objects.filter(customer=request.user, movie=movie).order_by("-created_at").first()
        )
        if purchase is None:
            return Response(
                {
                    "error": "Purchase this movie before marking it watched.",
                    "detail": "Purchase this movie before marking it watched.",
                },
                status=403,
            )
        existing = WatchHistory.objects.filter(customer=request.user, movie=movie, completed=True).first()
        if existing:
            return Response({"completed": True, "movie_id": movie.id, "events": []})
        WatchHistory.objects.create(
            customer=request.user,
            movie=movie,
            purchase=purchase,
            completed=True,
        )
        event, _n8n = record_event(
            event_type=Event.Type.WATCH_COMPLETED,
            customer=request.user,
            movie=movie,
            metadata={"duration": movie.duration, "movie_title": movie.title, "display_name": request.user.name},
        )
        return Response(with_events({"completed": True, "movie_id": movie.id}, [event]), status=201)
