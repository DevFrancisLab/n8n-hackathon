from rest_framework import serializers

from events.models import Event
from events.services import event_payload


class EventWriteSerializer(serializers.Serializer):
    event = serializers.ChoiceField(choices=Event.Type.values)
    customer_id = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    movie_id = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    checkout_id = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    timestamp = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    metadata = serializers.JSONField(required=False)
    id = serializers.CharField(required=False, allow_blank=True, allow_null=True)


class EventSerializer(serializers.BaseSerializer):
    def to_representation(self, instance):
        return event_payload(instance)
