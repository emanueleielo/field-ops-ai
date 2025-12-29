"""API v1 endpoints."""

from app.api.v1.endpoints.documents import router as documents_router
from app.api.v1.endpoints.phone_numbers import router as phone_numbers_router
from app.api.v1.endpoints.quota import router as quota_router
from app.api.v1.endpoints.settings import router as settings_router

__all__ = [
    "documents_router",
    "phone_numbers_router",
    "quota_router",
    "settings_router",
]
