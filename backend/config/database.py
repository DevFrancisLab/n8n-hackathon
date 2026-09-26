import os
from urllib.parse import unquote, urlparse

from django.core.exceptions import ImproperlyConfigured


def database_from_env():
    """PostgreSQL only. There is no SQLite fallback."""
    url = os.environ.get("DATABASE_URL", "").strip()
    if url:
        parsed = urlparse(url)
        name = parsed.path.lstrip("/")
        if parsed.scheme not in {"postgres", "postgresql"} or not name:
            raise ImproperlyConfigured("DATABASE_URL must be a PostgreSQL URL.")
        return {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": name,
            "USER": unquote(parsed.username or ""),
            "PASSWORD": unquote(parsed.password or ""),
            "HOST": parsed.hostname or "127.0.0.1",
            "PORT": str(parsed.port or 5432),
        }

    name = os.environ.get("POSTGRES_DB", "").strip()
    user = os.environ.get("POSTGRES_USER", "").strip()
    if not name or not user:
        raise ImproperlyConfigured(
            "PostgreSQL is required. Set DATABASE_URL or POSTGRES_DB, POSTGRES_USER, "
            "POSTGRES_PASSWORD, POSTGRES_HOST, and POSTGRES_PORT in backend/.env."
        )
    return {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": name,
        "USER": user,
        "PASSWORD": os.environ.get("POSTGRES_PASSWORD", ""),
        "HOST": os.environ.get("POSTGRES_HOST", "127.0.0.1"),
        "PORT": os.environ.get("POSTGRES_PORT", "5432"),
    }
