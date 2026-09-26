from django.contrib import admin

from movies.models import Movie, WatchHistory


@admin.register(Movie)
class MovieAdmin(admin.ModelAdmin):
    list_display = ("title", "genre", "country", "year", "price", "featured", "demo")
    list_filter = ("genre", "country", "year", "featured", "demo")
    search_fields = ("title", "country", "language")


@admin.register(WatchHistory)
class WatchHistoryAdmin(admin.ModelAdmin):
    list_display = ("customer", "movie", "completed", "watched_at")
    list_filter = ("completed",)
    search_fields = ("customer__email", "movie__title")
