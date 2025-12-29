"""API v1 Pydantic schemas."""

from app.api.v1.schemas.auth import (
    AuthResponse,
    AuthUserResponse,
    LoginRequest,
    MessageResponse,
    PasswordResetRequest,
    PasswordUpdateRequest,
    RefreshRequest,
    RegisterRequest,
    UserResponse,
)
from app.api.v1.schemas.document import (
    DocumentDeleteResponse,
    DocumentListResponse,
    DocumentProcessingStatus,
    DocumentResponse,
    DocumentUploadResponse,
    DuplicateDocumentResponse,
)
from app.api.v1.schemas.phone_number import (
    PhoneNumberCreate,
    PhoneNumberCreateResponse,
    PhoneNumberDeleteResponse,
    PhoneNumberListResponse,
    PhoneNumberResponse,
    PhoneNumberUpdate,
)

__all__ = [
    "AuthResponse",
    "AuthUserResponse",
    "DocumentDeleteResponse",
    "DocumentListResponse",
    "DocumentProcessingStatus",
    "DocumentResponse",
    "DocumentUploadResponse",
    "DuplicateDocumentResponse",
    "LoginRequest",
    "MessageResponse",
    "PasswordResetRequest",
    "PasswordUpdateRequest",
    "PhoneNumberCreate",
    "PhoneNumberCreateResponse",
    "PhoneNumberDeleteResponse",
    "PhoneNumberListResponse",
    "PhoneNumberResponse",
    "PhoneNumberUpdate",
    "RefreshRequest",
    "RegisterRequest",
    "UserResponse",
]
