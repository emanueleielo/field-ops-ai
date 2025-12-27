"""Security utilities for authentication and authorization."""

import secrets
from typing import Annotated

from fastapi import Depends, HTTPException, Security, status
from fastapi.security import APIKeyHeader

from app.config import Settings, get_settings

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


def verify_api_key(
    api_key: Annotated[str | None, Security(api_key_header)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> str:
    """Verify the API key from request header.

    Args:
        api_key: The API key from the request header.
        settings: Application settings.

    Returns:
        The validated API key.

    Raises:
        HTTPException: If the API key is missing or invalid.
    """
    if api_key is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing API key",
        )

    # For now, compare against a configured API key
    # In production, this would validate against stored keys in the database
    if not secrets.compare_digest(api_key, settings.secret_key):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid API key",
        )

    return api_key


def generate_api_key() -> str:
    """Generate a secure random API key.

    Returns:
        A 32-character hexadecimal API key.
    """
    return secrets.token_hex(32)
