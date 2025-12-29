"""Supabase client singleton for backend services."""

from functools import lru_cache

from supabase import Client, create_client

from app.config import get_settings


class SupabaseClientError(Exception):
    """Exception raised when Supabase client cannot be initialized."""


@lru_cache
def get_supabase_client() -> Client:
    """Get cached Supabase client instance.

    Returns:
        Supabase client configured with URL and service role key.

    Raises:
        SupabaseClientError: If Supabase URL or key is not configured.
    """
    settings = get_settings()

    if not settings.supabase_url:
        raise SupabaseClientError("SUPABASE_URL is not configured")
    if not settings.supabase_key:
        raise SupabaseClientError("SUPABASE_KEY is not configured")

    return create_client(settings.supabase_url, settings.supabase_key)


def get_supabase_admin_client() -> Client:
    """Get Supabase client with admin (service role) privileges.

    This is the same as get_supabase_client() since we use
    the service role key. Provided for semantic clarity.

    Returns:
        Supabase client with admin privileges.
    """
    return get_supabase_client()
