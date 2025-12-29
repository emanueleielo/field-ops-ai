"""Admin API endpoints."""

from app.api.v1.endpoints.admin.auth import router as admin_auth_router
from app.api.v1.endpoints.admin.config import router as admin_config_router
from app.api.v1.endpoints.admin.dashboard import router as admin_dashboard_router
from app.api.v1.endpoints.admin.health import router as admin_health_router
from app.api.v1.endpoints.admin.notifications import router as admin_notifications_router
from app.api.v1.endpoints.admin.users import router as admin_users_router

__all__ = [
    "admin_auth_router",
    "admin_config_router",
    "admin_dashboard_router",
    "admin_health_router",
    "admin_notifications_router",
    "admin_users_router",
]
