from datetime import timezone

from django.utils import timezone as django_timezone


def isoformat(value):
    if value is None:
        return None
    aware = value
    if django_timezone.is_naive(aware):
        aware = django_timezone.make_aware(aware, timezone.utc)
    return aware.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
