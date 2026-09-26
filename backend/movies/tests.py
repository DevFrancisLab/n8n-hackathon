from django.core.management import call_command
from django.test import TestCase
from rest_framework.test import APIClient

from movies.models import Movie


class MovieApiTests(TestCase):
    def setUp(self):
        call_command("seed_demo_data")
        self.client = APIClient()

    def test_list_detail_and_filters(self):
        listing = self.client.get("/api/movies")
        self.assertEqual(listing.status_code, 200)
        self.assertGreaterEqual(len(listing.data), 28)
        harvest = next(movie for movie in listing.data if movie["id"] == "the-last-harvest")
        self.assertEqual(harvest["price"], 500)
        self.assertTrue(harvest["demo"])
        self.assertEqual(harvest["palette"]["accent"], "#E2A84A")

        detail = self.client.get("/api/movies/the-last-harvest")
        self.assertEqual(detail.status_code, 200)
        self.assertEqual(detail.data["title"], "The Last Harvest")

        missing = self.client.get("/api/movies/not-a-movie")
        self.assertEqual(missing.status_code, 404)

        filtered = self.client.get("/api/movies", {"genre": "Thriller", "country": "Kenya", "search": "harvest"})
        self.assertEqual([movie["id"] for movie in filtered.data], ["the-last-harvest"])

    def test_seed_is_idempotent(self):
        before = Movie.objects.count()
        call_command("seed_demo_data")
        self.assertEqual(Movie.objects.count(), before)
