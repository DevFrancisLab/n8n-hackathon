from django.urls import path

from movies.views import MovieDetailView, MovieListView, WatchView

urlpatterns = [
    path("movies", MovieListView.as_view()),
    path("movies/<slug:movie_id>", MovieDetailView.as_view()),
    path("watch", WatchView.as_view()),
]
