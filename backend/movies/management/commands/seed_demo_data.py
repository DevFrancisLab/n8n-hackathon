import json
from pathlib import Path

from django.core.management.base import BaseCommand

from movies.models import Movie

CATALOG = Path(__file__).resolve().parents[2] / "demo_catalog.json"


class Command(BaseCommand):
    help = "Load the fictional YakWetu demo catalog. Safe to run more than once."

    def handle(self, *args, **options):
        records = json.loads(CATALOG.read_text(encoding="utf-8"))
        created = 0
        updated = 0
        for record in records:
            _movie, was_created = Movie.objects.update_or_create(
                id=record["id"],
                defaults={
                    "title": record["title"],
                    "overview": record["overview"],
                    "genre": record["genre"],
                    "country": record["country"],
                    "language": record["language"],
                    "year": record["year"],
                    "duration": record["duration"],
                    "price": record["price"],
                    "poster": record["poster"],
                    "backdrop": record["backdrop"],
                    "palette": record["palette"],
                    "motif": record["motif"],
                    "tags": record["tags"],
                    "featured": bool(record.get("featured", False)),
                    "trending_rank": record.get("trendingRank"),
                    "demo": True,
                },
            )
            if was_created:
                created += 1
            else:
                updated += 1
        self.stdout.write(self.style.SUCCESS(f"Demo catalog ready. created={created} updated={updated}"))
