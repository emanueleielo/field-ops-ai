"""API v1 router aggregating all endpoint routers."""

from fastapi import APIRouter

from app.api.v1.endpoints import (
    documents_router,
    phone_numbers_router,
    quota_router,
    settings_router,
)

router = APIRouter(prefix="/api/v1")

# Include document endpoints
router.include_router(documents_router)

# Include phone number endpoints
router.include_router(phone_numbers_router)

# Include quota endpoints
router.include_router(quota_router)

# Include settings endpoints
router.include_router(settings_router)
