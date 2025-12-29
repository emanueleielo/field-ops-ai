"""Admin notification management endpoints."""

import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.endpoints.admin.auth import get_current_admin
from app.api.v1.schemas.admin.notifications import (
    NotificationResponse,
    NotificationsList,
    NotificationUpdate,
    UnreadCountResponse,
)
from app.db.session import get_db
from app.models.admin import Admin
from app.services.admin.notification_service import NotificationService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin/notifications", tags=["admin-notifications"])


@router.get("", response_model=NotificationsList)
async def get_notifications(
    page: int = Query(default=1, ge=1, description="Page number"),
    limit: int = Query(default=20, ge=1, le=100, description="Notifications per page"),
    unread_only: bool = Query(
        default=False, description="If true, only return unread notifications"
    ),
    db: AsyncSession = Depends(get_db),
    _admin: Admin = Depends(get_current_admin),
) -> NotificationsList:
    """Get paginated list of admin notifications.

    Returns notifications ordered by creation date (newest first).
    Includes unread count for badge display.
    Requires admin authentication.
    """
    service = NotificationService()

    notifications, total = await service.get_notifications(
        db=db, page=page, limit=limit, unread_only=unread_only
    )
    unread_count = await service.get_unread_count(db)

    return NotificationsList(
        notifications=[
            NotificationResponse(
                id=str(n.id),
                type=n.type,
                title=n.title,
                message=n.message,
                data=n.data,
                is_read=n.is_read,
                created_at=n.created_at.isoformat(),
            )
            for n in notifications
        ],
        total=total,
        unread_count=unread_count,
        page=page,
        limit=limit,
    )


@router.get("/unread-count", response_model=UnreadCountResponse)
async def get_unread_count(
    db: AsyncSession = Depends(get_db),
    _admin: Admin = Depends(get_current_admin),
) -> UnreadCountResponse:
    """Get count of unread notifications.

    Used for displaying notification badge in the header.
    Requires admin authentication.
    """
    service = NotificationService()
    count = await service.get_unread_count(db)

    return UnreadCountResponse(unread_count=count)


@router.patch("/{notification_id}", response_model=NotificationResponse)
async def update_notification(
    notification_id: str,
    update: NotificationUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: Admin = Depends(get_current_admin),
) -> NotificationResponse:
    """Mark a notification as read or unread.

    Updates the read status of a specific notification.
    Requires admin authentication.
    """
    service = NotificationService()

    if update.is_read:
        notification = await service.mark_as_read(db, notification_id)
    else:
        notification = await service.mark_as_unread(db, notification_id)

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Notification not found: {notification_id}",
        )

    return NotificationResponse(
        id=str(notification.id),
        type=notification.type,
        title=notification.title,
        message=notification.message,
        data=notification.data,
        is_read=notification.is_read,
        created_at=notification.created_at.isoformat(),
    )


@router.post("/mark-all-read", response_model=UnreadCountResponse)
async def mark_all_as_read(
    db: AsyncSession = Depends(get_db),
    _admin: Admin = Depends(get_current_admin),
) -> UnreadCountResponse:
    """Mark all notifications as read.

    Useful for clearing the notification badge.
    Requires admin authentication.
    """
    service = NotificationService()
    await service.mark_all_as_read(db)

    return UnreadCountResponse(unread_count=0)


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_notification(
    notification_id: str,
    db: AsyncSession = Depends(get_db),
    _admin: Admin = Depends(get_current_admin),
) -> None:
    """Delete a notification.

    Permanently removes a notification from the system.
    Requires admin authentication.
    """
    service = NotificationService()
    deleted = await service.delete_notification(db, notification_id)

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Notification not found: {notification_id}",
        )


@router.delete("/read", status_code=status.HTTP_204_NO_CONTENT)
async def delete_read_notifications(
    db: AsyncSession = Depends(get_db),
    _admin: Admin = Depends(get_current_admin),
) -> None:
    """Delete all read notifications.

    Cleans up old notifications that have already been acknowledged.
    Requires admin authentication.
    """
    service = NotificationService()
    await service.delete_read_notifications(db)
