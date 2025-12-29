"""API v1 router aggregating all endpoint routers."""

from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth_router,
    documents_router,
    phone_numbers_router,
    quota_router,
    settings_router,
)
from app.api.v1.endpoints.admin import (
    admin_auth_router,
    admin_config_router,
    admin_dashboard_router,
    admin_health_router,
    admin_notifications_router,
    admin_users_router,
)

router = APIRouter(prefix="/api/v1")

# Include auth endpoints
router.include_router(auth_router)

# Include document endpoints
router.include_router(documents_router)

# Include phone number endpoints
router.include_router(phone_numbers_router)

# Include quota endpoints
router.include_router(quota_router)

# Include settings endpoints
router.include_router(settings_router)

# Include admin endpoints
router.include_router(admin_auth_router)
router.include_router(admin_config_router)
router.include_router(admin_dashboard_router)
router.include_router(admin_health_router)
router.include_router(admin_notifications_router)
router.include_router(admin_users_router)
