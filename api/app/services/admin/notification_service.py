"""Notification service for admin alerts and notifications."""

import logging
from datetime import datetime
from typing import Any
from uuid import uuid4

from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.admin_notification import AdminNotification, AdminNotificationTypeEnum

logger = logging.getLogger(__name__)


class NotificationService:
    """Service for managing admin notifications.

    Handles creation, retrieval, and management of admin notifications
    for system alerts, warnings, and informational messages.
    """

    async def create_notification(
        self,
        db: AsyncSession,
        notification_type: AdminNotificationTypeEnum,
        title: str,
        message: str,
        data: dict[str, Any] | None = None,
    ) -> AdminNotification:
        """Create a new admin notification.

        Args:
            db: Database session.
            notification_type: Type of notification (critical, warning, info).
            title: Notification title.
            message: Notification message.
            data: Optional additional data.

        Returns:
            Created notification.
        """
        notification = AdminNotification(
            id=uuid4(),
            type=notification_type,
            title=title,
            message=message,
            data=data,
            is_read=False,
        )

        db.add(notification)
        await db.commit()
        await db.refresh(notification)

        logger.info(f"Created admin notification: {title} ({notification_type.value})")

        return notification

    async def get_notifications(
        self,
        db: AsyncSession,
        page: int = 1,
        limit: int = 20,
        unread_only: bool = False,
    ) -> tuple[list[AdminNotification], int]:
        """Get paginated list of notifications.

        Args:
            db: Database session.
            page: Page number (1-indexed).
            limit: Number of notifications per page.
            unread_only: If True, only return unread notifications.

        Returns:
            Tuple of (notifications list, total count).
        """
        # Build query
        query = select(AdminNotification)

        if unread_only:
            query = query.where(AdminNotification.is_read == False)  # noqa: E712

        # Get total count
        count_query = select(func.count(AdminNotification.id))
        if unread_only:
            count_query = count_query.where(AdminNotification.is_read == False)  # noqa: E712

        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0

        # Apply pagination and ordering
        offset = (page - 1) * limit
        query = (
            query
            .order_by(desc(AdminNotification.created_at))
            .offset(offset)
            .limit(limit)
        )

        result = await db.execute(query)
        notifications = list(result.scalars().all())

        return notifications, total

    async def mark_as_read(
        self, db: AsyncSession, notification_id: str
    ) -> AdminNotification | None:
        """Mark a notification as read.

        Args:
            db: Database session.
            notification_id: ID of notification to mark as read.

        Returns:
            Updated notification or None if not found.
        """
        result = await db.execute(
            select(AdminNotification).where(AdminNotification.id == notification_id)
        )
        notification = result.scalar_one_or_none()

        if notification:
            notification.is_read = True
            await db.commit()
            await db.refresh(notification)
            logger.debug(f"Marked notification {notification_id} as read")

        return notification

    async def mark_as_unread(
        self, db: AsyncSession, notification_id: str
    ) -> AdminNotification | None:
        """Mark a notification as unread.

        Args:
            db: Database session.
            notification_id: ID of notification to mark as unread.

        Returns:
            Updated notification or None if not found.
        """
        result = await db.execute(
            select(AdminNotification).where(AdminNotification.id == notification_id)
        )
        notification = result.scalar_one_or_none()

        if notification:
            notification.is_read = False
            await db.commit()
            await db.refresh(notification)
            logger.debug(f"Marked notification {notification_id} as unread")

        return notification

    async def get_unread_count(self, db: AsyncSession) -> int:
        """Get count of unread notifications.

        Args:
            db: Database session.

        Returns:
            Number of unread notifications.
        """
        result = await db.execute(
            select(func.count(AdminNotification.id)).where(
                AdminNotification.is_read == False  # noqa: E712
            )
        )
        return result.scalar() or 0

    async def delete_notification(
        self, db: AsyncSession, notification_id: str
    ) -> bool:
        """Delete a notification.

        Args:
            db: Database session.
            notification_id: ID of notification to delete.

        Returns:
            True if deleted, False if not found.
        """
        result = await db.execute(
            select(AdminNotification).where(AdminNotification.id == notification_id)
        )
        notification = result.scalar_one_or_none()

        if notification:
            await db.delete(notification)
            await db.commit()
            logger.info(f"Deleted notification {notification_id}")
            return True

        return False

    async def delete_read_notifications(self, db: AsyncSession) -> int:
        """Delete all read notifications.

        Args:
            db: Database session.

        Returns:
            Number of notifications deleted.
        """
        result = await db.execute(
            select(AdminNotification).where(
                AdminNotification.is_read == True  # noqa: E712
            )
        )
        notifications = result.scalars().all()

        count = 0
        for notification in notifications:
            await db.delete(notification)
            count += 1

        await db.commit()
        logger.info(f"Deleted {count} read notifications")

        return count

    async def mark_all_as_read(self, db: AsyncSession) -> int:
        """Mark all notifications as read.

        Args:
            db: Database session.

        Returns:
            Number of notifications marked as read.
        """
        result = await db.execute(
            select(AdminNotification).where(
                AdminNotification.is_read == False  # noqa: E712
            )
        )
        notifications = result.scalars().all()

        count = 0
        for notification in notifications:
            notification.is_read = True
            count += 1

        await db.commit()
        logger.info(f"Marked {count} notifications as read")

        return count

    # Convenience methods for creating specific notification types

    async def create_critical(
        self,
        db: AsyncSession,
        title: str,
        message: str,
        data: dict[str, Any] | None = None,
    ) -> AdminNotification:
        """Create a critical notification (service down, security issue).

        Args:
            db: Database session.
            title: Notification title.
            message: Notification message.
            data: Optional additional data.

        Returns:
            Created notification.
        """
        return await self.create_notification(
            db=db,
            notification_type=AdminNotificationTypeEnum.critical,
            title=title,
            message=message,
            data=data,
        )

    async def create_warning(
        self,
        db: AsyncSession,
        title: str,
        message: str,
        data: dict[str, Any] | None = None,
    ) -> AdminNotification:
        """Create a warning notification (quota exceeded, payment failed).

        Args:
            db: Database session.
            title: Notification title.
            message: Notification message.
            data: Optional additional data.

        Returns:
            Created notification.
        """
        return await self.create_notification(
            db=db,
            notification_type=AdminNotificationTypeEnum.warning,
            title=title,
            message=message,
            data=data,
        )

    async def create_info(
        self,
        db: AsyncSession,
        title: str,
        message: str,
        data: dict[str, Any] | None = None,
    ) -> AdminNotification:
        """Create an info notification (new signup, subscription change).

        Args:
            db: Database session.
            title: Notification title.
            message: Notification message.
            data: Optional additional data.

        Returns:
            Created notification.
        """
        return await self.create_notification(
            db=db,
            notification_type=AdminNotificationTypeEnum.info,
            title=title,
            message=message,
            data=data,
        )
