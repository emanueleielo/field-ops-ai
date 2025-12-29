"""API v1 Pydantic schemas."""

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
    "DocumentDeleteResponse",
    "DocumentListResponse",
    "DocumentProcessingStatus",
    "DocumentResponse",
    "DocumentUploadResponse",
    "DuplicateDocumentResponse",
    "PhoneNumberCreate",
    "PhoneNumberCreateResponse",
    "PhoneNumberDeleteResponse",
    "PhoneNumberListResponse",
    "PhoneNumberResponse",
    "PhoneNumberUpdate",
]
