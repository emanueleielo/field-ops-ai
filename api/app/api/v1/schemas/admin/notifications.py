"""Pydantic schemas for admin notification endpoints."""

from pydantic import BaseModel, Field

from app.models.admin_notification import AdminNotificationTypeEnum


class NotificationResponse(BaseModel):
    """Schema for a single admin notification."""

    id: str = Field(..., description="Notification ID")
    type: AdminNotificationTypeEnum = Field(
        ..., description="Notification type (critical, warning, info)"
    )
    title: str = Field(..., description="Notification title")
    message: str = Field(..., description="Notification message")
    data: dict | None = Field(None, description="Additional notification data")
    is_read: bool = Field(..., description="Whether notification has been read")
    created_at: str = Field(..., description="Creation timestamp")

    class Config:
        """Pydantic model config."""

        from_attributes = True


class NotificationsList(BaseModel):
    """Schema for paginated notifications list."""

    notifications: list[NotificationResponse] = Field(
        ..., description="List of notifications"
    )
    total: int = Field(..., description="Total number of notifications")
    unread_count: int = Field(..., description="Number of unread notifications")
    page: int = Field(..., description="Current page")
    limit: int = Field(..., description="Notifications per page")


class NotificationUpdate(BaseModel):
    """Schema for updating notification status."""

    is_read: bool = Field(..., description="Mark notification as read/unread")


class NotificationCreate(BaseModel):
    """Schema for creating a notification (internal use)."""

    type: AdminNotificationTypeEnum = Field(
        ..., description="Notification type (critical, warning, info)"
    )
    title: str = Field(..., max_length=255, description="Notification title")
    message: str = Field(..., description="Notification message")
    data: dict | None = Field(None, description="Additional notification data")


class UnreadCountResponse(BaseModel):
    """Schema for unread count response."""

    unread_count: int = Field(..., description="Number of unread notifications")
