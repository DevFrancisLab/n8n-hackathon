from rest_framework import serializers

from config.money import money
from movies.models import Movie


class MovieSerializer(serializers.ModelSerializer):
    trendingRank = serializers.IntegerField(source="trending_rank", allow_null=True, required=False)

    class Meta:
        model = Movie
        fields = [
            "id",
            "title",
            "overview",
            "genre",
            "country",
            "language",
            "year",
            "duration",
            "price",
            "poster",
            "backdrop",
            "palette",
            "motif",
            "tags",
            "featured",
            "trendingRank",
            "demo",
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["price"] = money(instance.price)
        data["demo"] = True
        if instance.trending_rank is None:
            data.pop("trendingRank", None)
        elif not instance.featured:
            pass
        return data
