"""Admin API schemas."""

from app.api.v1.schemas.admin.auth import (
    AdminLoginRequest,
    AdminLoginResponse,
    AdminLogoutResponse,
)
from app.api.v1.schemas.admin.config import (
    SystemSettingsResponse,
    SystemSettingsUpdate,
    TierConfigListResponse,
    TierConfigResponse,
    TierConfigUpdate,
)
from app.api.v1.schemas.admin.dashboard import (
    BusinessKPIs,
    DashboardResponse,
    TechnicalKPIs,
)
from app.api.v1.schemas.admin.health import (
    HealthResponse,
    LogEntry,
    LogsResponse,
    ServiceStatus,
    ServiceStatusEnum,
)
from app.api.v1.schemas.admin.notifications import (
    NotificationCreate,
    NotificationResponse,
    NotificationsList,
    NotificationUpdate,
    UnreadCountResponse,
)
from app.api.v1.schemas.admin.users import (
    DocumentSummary,
    ImpersonateResponse,
    PaginationMeta,
    PhoneNumberInfo,
    QuotaInfo,
    UserDeleteResponse,
    UserDetailResponse,
    UserListItem,
    UserListResponse,
    UserUpdateRequest,
    UserUpdateResponse,
)

__all__ = [
    # Auth
    "AdminLoginRequest",
    "AdminLoginResponse",
    "AdminLogoutResponse",
    # Dashboard
    "BusinessKPIs",
    "DashboardResponse",
    "TechnicalKPIs",
    # Config
    "SystemSettingsResponse",
    "SystemSettingsUpdate",
    "TierConfigListResponse",
    "TierConfigResponse",
    "TierConfigUpdate",
    # Health
    "HealthResponse",
    "LogEntry",
    "LogsResponse",
    "ServiceStatus",
    "ServiceStatusEnum",
    # Notifications
    "NotificationCreate",
    "NotificationResponse",
    "NotificationsList",
    "NotificationUpdate",
    "UnreadCountResponse",
    # Users
    "DocumentSummary",
    "ImpersonateResponse",
    "PaginationMeta",
    "PhoneNumberInfo",
    "QuotaInfo",
    "UserDeleteResponse",
    "UserDetailResponse",
    "UserListItem",
    "UserListResponse",
    "UserUpdateRequest",
    "UserUpdateResponse",
]
