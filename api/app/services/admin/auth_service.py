"""Admin authentication service."""

import secrets
from datetime import datetime, timedelta
from typing import Any
from uuid import UUID

import jwt
from passlib.hash import bcrypt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models.admin import Admin


class AdminAuthError(Exception):
    """Exception raised for admin authentication errors."""

    pass


class AdminAuthService:
    """Service for admin authentication operations.

    Handles admin login, password verification, and JWT token management.
    Admin authentication is separate from regular user authentication.
    """

    # JWT configuration
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_HOURS = 24
    TOKEN_TYPE = "admin"

    def __init__(self) -> None:
        """Initialize the auth service."""
        self.settings = get_settings()

    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password using bcrypt.

        Args:
            password: Plain text password.

        Returns:
            Bcrypt hash of the password.
        """
        result: str = bcrypt.hash(password)
        return result

    @staticmethod
    def verify_password(password: str, password_hash: str) -> bool:
        """Verify a password against its hash.

        Args:
            password: Plain text password to verify.
            password_hash: Bcrypt hash to verify against.

        Returns:
            True if password matches, False otherwise.
        """
        result: bool = bcrypt.verify(password, password_hash)
        return result

    def create_access_token(
        self,
        admin_id: UUID,
        email: str,
        expires_delta: timedelta | None = None,
    ) -> str:
        """Create a JWT access token for an admin.

        Args:
            admin_id: Admin UUID.
            email: Admin email.
            expires_delta: Optional custom expiration time.

        Returns:
            Encoded JWT token.
        """
        if expires_delta is None:
            expires_delta = timedelta(hours=self.ACCESS_TOKEN_EXPIRE_HOURS)

        expire = datetime.utcnow() + expires_delta
        payload: dict[str, Any] = {
            "sub": str(admin_id),
            "email": email,
            "type": self.TOKEN_TYPE,
            "exp": expire,
            "iat": datetime.utcnow(),
            "jti": secrets.token_hex(16),  # Unique token ID
        }

        return jwt.encode(payload, self.settings.secret_key, algorithm=self.ALGORITHM)

    def decode_token(self, token: str) -> dict[str, Any]:
        """Decode and verify a JWT token.

        Args:
            token: JWT token to decode.

        Returns:
            Decoded token payload.

        Raises:
            AdminAuthError: If token is invalid or expired.
        """
        try:
            payload: dict[str, Any] = jwt.decode(
                token, self.settings.secret_key, algorithms=[self.ALGORITHM]
            )

            # Verify token type
            if payload.get("type") != self.TOKEN_TYPE:
                raise AdminAuthError("Invalid token type")

            return payload

        except jwt.ExpiredSignatureError as e:
            raise AdminAuthError("Token has expired") from e
        except jwt.InvalidTokenError as e:
            raise AdminAuthError("Invalid token") from e

    async def authenticate(
        self,
        db: AsyncSession,
        email: str,
        password: str,
    ) -> tuple[Admin, str]:
        """Authenticate an admin and return a JWT token.

        Args:
            db: Database session.
            email: Admin email.
            password: Admin password.

        Returns:
            Tuple of (Admin object, JWT token).

        Raises:
            AdminAuthError: If authentication fails.
        """
        # Find admin by email
        result = await db.execute(select(Admin).where(Admin.email == email))
        admin = result.scalar_one_or_none()

        if not admin:
            raise AdminAuthError("Invalid email or password")

        # Verify password
        if not self.verify_password(password, admin.password_hash):
            raise AdminAuthError("Invalid email or password")

        # Update last login time
        admin.last_login = datetime.utcnow()
        await db.commit()

        # Create JWT token
        token = self.create_access_token(admin.id, admin.email)

        return admin, token

    async def get_admin_by_id(
        self,
        db: AsyncSession,
        admin_id: UUID,
    ) -> Admin | None:
        """Get an admin by ID.

        Args:
            db: Database session.
            admin_id: Admin UUID.

        Returns:
            Admin object if found, None otherwise.
        """
        result = await db.execute(select(Admin).where(Admin.id == admin_id))
        return result.scalar_one_or_none()

    async def validate_token(
        self,
        db: AsyncSession,
        token: str,
    ) -> Admin:
        """Validate a JWT token and return the admin.

        Args:
            db: Database session.
            token: JWT token to validate.

        Returns:
            Admin object if token is valid.

        Raises:
            AdminAuthError: If token is invalid or admin not found.
        """
        payload = self.decode_token(token)
        admin_id = UUID(payload["sub"])

        admin = await self.get_admin_by_id(db, admin_id)
        if not admin:
            raise AdminAuthError("Admin not found")

        return admin
