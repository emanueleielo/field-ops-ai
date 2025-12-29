"""Admin user management service."""

import logging
import secrets
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Any
from uuid import UUID, uuid4

import jwt
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import get_settings
from app.models.activity import ActivityLog
from app.models.conversation import ConversationState
from app.models.document import Document
from app.models.enums import TierEnum
from app.models.impersonation_session import ImpersonationSession
from app.models.message import Message
from app.models.organization import Organization
from app.models.phone_number import PhoneNumber
from app.services.storage import StorageService
from app.services.vector_store import VectorStoreService

logger = logging.getLogger(__name__)


class UserServiceError(Exception):
    """Exception raised for user service errors."""

    pass


class UserNotFoundError(UserServiceError):
    """Exception raised when user is not found."""

    pass


class UserService:
    """Service for admin user management operations.

    Handles listing, viewing, updating, deleting users and session impersonation.
    """

    # JWT configuration for impersonation tokens
    ALGORITHM = "HS256"
    IMPERSONATION_TOKEN_EXPIRE_HOURS = 2
    TOKEN_TYPE = "impersonation"

    def __init__(self) -> None:
        """Initialize the user service."""
        self.settings = get_settings()
        self.storage_service = StorageService()

    async def list_users(
        self,
        db: AsyncSession,
        page: int = 1,
        limit: int = 20,
        search: str | None = None,
        tier_filter: TierEnum | None = None,
    ) -> dict[str, Any]:
        """List users with pagination, search, and filtering.

        Args:
            db: Database session.
            page: Page number (1-indexed).
            limit: Number of items per page.
            search: Optional search string (matches name or email).
            tier_filter: Optional tier to filter by.

        Returns:
            Dict with users list and pagination metadata.
        """
        # Build base query
        query = select(Organization).options(
            selectinload(Organization.phone_numbers),
            selectinload(Organization.documents),
        )

        # Apply search filter
        if search:
            search_pattern = f"%{search}%"
            # We'll search in organization name (acting as email proxy for now)
            query = query.where(Organization.name.ilike(search_pattern))

        # Apply tier filter
        if tier_filter:
            query = query.where(Organization.tier == tier_filter)

        # Get total count
        count_query = select(func.count()).select_from(
            query.subquery()
        )
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0

        # Calculate pagination
        total_pages = (total + limit - 1) // limit if total > 0 else 0
        offset = (page - 1) * limit

        # Apply pagination and ordering
        query = (
            query.order_by(Organization.created_at.desc()).offset(offset).limit(limit)
        )

        # Execute query
        result = await db.execute(query)
        organizations = result.scalars().all()

        # Get last activity for each user
        users = []
        for org in organizations:
            # Calculate quota percentage
            quota_pct = 0.0
            if org.quota_limit_euro and org.quota_limit_euro > 0:
                quota_pct = float(org.quota_used_euro / org.quota_limit_euro * 100)

            # Get last activity
            activity_query = (
                select(ActivityLog.created_at)
                .where(ActivityLog.organization_id == org.id)
                .order_by(ActivityLog.created_at.desc())
                .limit(1)
            )
            activity_result = await db.execute(activity_query)
            last_activity = activity_result.scalar_one_or_none()

            # For email, we use the organization name as a placeholder
            # In a real system, you'd have a User model linked to Organization
            email = f"{org.name.lower().replace(' ', '.')}@example.com"
            if org.phone_numbers:
                # Use first phone number as identifier
                email = f"user_{org.phone_numbers[0].number[-4:]}@fieldops.ai"

            users.append({
                "id": org.id,
                "email": email,
                "name": org.name,
                "tier": org.tier,
                "is_active": True,  # We don't have is_active field yet, default to True
                "quota_percentage": round(quota_pct, 1),
                "documents_count": len(org.documents),
                "created_at": org.created_at,
                "last_activity": last_activity,
            })

        return {
            "users": users,
            "meta": {
                "page": page,
                "limit": limit,
                "total": total,
                "total_pages": total_pages,
            },
        }

    async def get_user_detail(
        self,
        db: AsyncSession,
        user_id: UUID,
    ) -> dict[str, Any]:
        """Get detailed user information.

        Args:
            db: Database session.
            user_id: Organization UUID.

        Returns:
            Dict with detailed user information.

        Raises:
            UserNotFoundError: If user is not found.
        """
        # Get organization with related data
        query = (
            select(Organization)
            .options(
                selectinload(Organization.phone_numbers),
                selectinload(Organization.documents),
            )
            .where(Organization.id == user_id)
        )
        result = await db.execute(query)
        org = result.scalar_one_or_none()

        if not org:
            raise UserNotFoundError(f"User with ID {user_id} not found")

        # Calculate quota
        quota_pct = 0.0
        if org.quota_limit_euro and org.quota_limit_euro > 0:
            quota_pct = float(org.quota_used_euro / org.quota_limit_euro * 100)

        # Get message count
        message_count_query = (
            select(func.count())
            .select_from(Message)
            .where(Message.organization_id == user_id)
        )
        message_result = await db.execute(message_count_query)
        messages_count = message_result.scalar() or 0

        # Build email placeholder
        email = f"{org.name.lower().replace(' ', '.')}@example.com"
        if org.phone_numbers:
            email = f"user_{org.phone_numbers[0].number[-4:]}@fieldops.ai"

        # Build phone numbers list
        phone_numbers = [
            {
                "id": pn.id,
                "number": pn.number,
                "is_primary": pn.is_primary if hasattr(pn, 'is_primary') else True,
                "created_at": pn.created_at,
            }
            for pn in org.phone_numbers
        ]

        # Build documents list
        documents = [
            {
                "id": doc.id,
                "filename": doc.filename,
                "status": doc.status.value,
                "file_size_bytes": doc.file_size_bytes,
                "created_at": doc.created_at,
            }
            for doc in org.documents
        ]

        return {
            "id": org.id,
            "email": email,
            "name": org.name,
            "tier": org.tier,
            "is_active": True,
            "quota": {
                "limit_euro": org.quota_limit_euro,
                "used_euro": org.quota_used_euro,
                "percentage": round(quota_pct, 1),
            },
            "billing_day": org.billing_day,
            "stripe_customer_id": org.stripe_customer_id,
            "stripe_subscription_id": org.stripe_subscription_id,
            "phone_numbers": phone_numbers,
            "documents": documents,
            "documents_count": len(org.documents),
            "messages_count": messages_count,
            "created_at": org.created_at,
            "updated_at": org.updated_at,
        }

    async def update_user(
        self,
        db: AsyncSession,
        user_id: UUID,
        tier: TierEnum | None = None,
        quota_limit_euro: Decimal | None = None,
        is_active: bool | None = None,
        name: str | None = None,
    ) -> dict[str, Any]:
        """Update user information.

        Args:
            db: Database session.
            user_id: Organization UUID.
            tier: New subscription tier.
            quota_limit_euro: New quota limit.
            is_active: Activate/deactivate user.
            name: New organization name.

        Returns:
            Dict with updated user information.

        Raises:
            UserNotFoundError: If user is not found.
        """
        # Get organization
        query = select(Organization).where(Organization.id == user_id)
        result = await db.execute(query)
        org = result.scalar_one_or_none()

        if not org:
            raise UserNotFoundError(f"User with ID {user_id} not found")

        # Apply updates
        if tier is not None:
            org.tier = tier
            logger.info(f"Updated tier for org {user_id} to {tier.value}")

        if quota_limit_euro is not None:
            org.quota_limit_euro = quota_limit_euro
            logger.info(f"Updated quota limit for org {user_id} to {quota_limit_euro}")

        if name is not None:
            org.name = name
            logger.info(f"Updated name for org {user_id} to {name}")

        # Note: is_active would require an additional field on Organization
        # For now, we log but don't persist
        if is_active is not None:
            logger.info(f"is_active update requested for org {user_id}: {is_active}")

        await db.commit()
        await db.refresh(org)

        return {
            "id": org.id,
            "tier": org.tier,
            "quota_limit_euro": org.quota_limit_euro,
            "is_active": True,  # Placeholder
            "name": org.name,
            "updated_at": org.updated_at,
        }

    async def delete_user(
        self,
        db: AsyncSession,
        user_id: UUID,
    ) -> dict[str, Any]:
        """Delete user and all related data.

        This is a cascade delete that removes:
        - Documents (and their files from storage)
        - Vector embeddings from Qdrant
        - Messages
        - Conversation states
        - Activity logs
        - Phone numbers
        - The organization itself

        Args:
            db: Database session.
            user_id: Organization UUID.

        Returns:
            Dict with deletion summary.

        Raises:
            UserNotFoundError: If user is not found.
        """
        # Get organization with related data
        query = (
            select(Organization)
            .options(
                selectinload(Organization.phone_numbers),
                selectinload(Organization.documents),
            )
            .where(Organization.id == user_id)
        )
        result = await db.execute(query)
        org = result.scalar_one_or_none()

        if not org:
            raise UserNotFoundError(f"User with ID {user_id} not found")

        # Store info for response
        email = f"{org.name.lower().replace(' ', '.')}@example.com"
        if org.phone_numbers:
            email = f"user_{org.phone_numbers[0].number[-4:]}@fieldops.ai"

        deleted_documents = len(org.documents)

        # Delete document files from storage and vectors from Qdrant
        vector_store = VectorStoreService()
        for doc in org.documents:
            try:
                # Delete from storage
                await self.storage_service.delete_file(doc.storage_path)
            except Exception as e:
                logger.warning(f"Failed to delete file {doc.storage_path}: {e}")

            try:
                # Delete vectors
                vector_store.delete_document(str(org.id), str(doc.id))
            except Exception as e:
                logger.warning(f"Failed to delete vectors for doc {doc.id}: {e}")

        # Count messages before deletion
        message_count_query = (
            select(func.count())
            .select_from(Message)
            .where(Message.organization_id == user_id)
        )
        message_result = await db.execute(message_count_query)
        deleted_messages = message_result.scalar() or 0

        # Delete related data (cascade should handle most of this,
        # but we do explicit deletes for safety)
        await db.execute(
            delete(Message).where(Message.organization_id == user_id)
        )
        await db.execute(
            delete(ConversationState).where(
                ConversationState.organization_id == user_id
            )
        )
        await db.execute(
            delete(ActivityLog).where(ActivityLog.organization_id == user_id)
        )
        await db.execute(
            delete(Document).where(Document.organization_id == user_id)
        )
        await db.execute(
            delete(PhoneNumber).where(PhoneNumber.organization_id == user_id)
        )
        await db.execute(
            delete(ImpersonationSession).where(ImpersonationSession.user_id == user_id)
        )

        # Delete the organization
        await db.delete(org)
        await db.commit()

        logger.info(
            f"Deleted user {user_id}: "
            f"{deleted_documents} docs, {deleted_messages} messages"
        )

        return {
            "id": user_id,
            "email": email,
            "message": "User and all associated data have been deleted",
            "deleted_documents": deleted_documents,
            "deleted_messages": deleted_messages,
        }

    def _create_impersonation_token(
        self,
        user_id: UUID,
        session_id: UUID,
        admin_id: UUID,
        expires_delta: timedelta | None = None,
    ) -> tuple[str, datetime]:
        """Create a JWT token for user impersonation.

        Args:
            user_id: Organization UUID being impersonated.
            session_id: Impersonation session UUID.
            admin_id: Admin UUID performing impersonation.
            expires_delta: Optional custom expiration time.

        Returns:
            Tuple of (token string, expiration datetime).
        """
        if expires_delta is None:
            expires_delta = timedelta(hours=self.IMPERSONATION_TOKEN_EXPIRE_HOURS)

        expire = datetime.utcnow() + expires_delta
        payload: dict[str, Any] = {
            "sub": str(user_id),
            "type": self.TOKEN_TYPE,
            "session_id": str(session_id),
            "admin_id": str(admin_id),
            "exp": expire,
            "iat": datetime.utcnow(),
            "jti": secrets.token_hex(16),
        }

        token = jwt.encode(payload, self.settings.secret_key, algorithm=self.ALGORITHM)
        return token, expire

    async def impersonate_user(
        self,
        db: AsyncSession,
        admin_id: UUID,
        user_id: UUID,
        admin_token: str,
    ) -> dict[str, Any]:
        """Create an impersonation session for a user.

        Args:
            db: Database session.
            admin_id: Admin UUID performing impersonation.
            user_id: Organization UUID to impersonate.
            admin_token: Original admin JWT token for session restoration.

        Returns:
            Dict with impersonation session details and tokens.

        Raises:
            UserNotFoundError: If user is not found.
        """
        # Verify user exists
        query = (
            select(Organization)
            .options(selectinload(Organization.phone_numbers))
            .where(Organization.id == user_id)
        )
        result = await db.execute(query)
        org = result.scalar_one_or_none()

        if not org:
            raise UserNotFoundError(f"User with ID {user_id} not found")

        # Create impersonation session
        session_id = uuid4()
        session = ImpersonationSession(
            id=session_id,
            admin_id=admin_id,
            user_id=user_id,
            started_at=datetime.utcnow(),
        )
        db.add(session)
        await db.commit()

        # Create impersonation token
        token, expires_at = self._create_impersonation_token(
            user_id=user_id,
            session_id=session_id,
            admin_id=admin_id,
        )

        # Build email placeholder
        email = f"{org.name.lower().replace(' ', '.')}@example.com"
        if org.phone_numbers:
            email = f"user_{org.phone_numbers[0].number[-4:]}@fieldops.ai"

        logger.info(f"Admin {admin_id} started impersonation of user {user_id}")

        return {
            "access_token": token,
            "token_type": "bearer",
            "user_id": user_id,
            "user_email": email,
            "admin_token": admin_token,
            "session_id": session_id,
            "expires_at": expires_at,
        }

    async def end_impersonation(
        self,
        db: AsyncSession,
        session_id: UUID,
    ) -> None:
        """End an impersonation session.

        Args:
            db: Database session.
            session_id: Impersonation session UUID.
        """
        query = select(ImpersonationSession).where(
            ImpersonationSession.id == session_id
        )
        result = await db.execute(query)
        session = result.scalar_one_or_none()

        if session:
            session.ended_at = datetime.utcnow()
            await db.commit()
            logger.info(f"Ended impersonation session {session_id}")
