"""Pydantic schemas for document endpoints."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import DocumentStatusEnum


class DocumentBase(BaseModel):
    """Base schema for document data."""

    filename: str = Field(..., description="Slugified filename")
    original_filename: str = Field(..., description="Original uploaded filename")
    file_type: str = Field(..., description="File extension (pdf, docx, etc.)")
    file_size_bytes: int = Field(..., description="File size in bytes")


class DocumentCreate(BaseModel):
    """Schema for document creation (internal use)."""

    organization_id: UUID
    filename: str
    original_filename: str
    file_type: str
    file_size_bytes: int
    file_hash: str
    storage_path: str
    status: DocumentStatusEnum = DocumentStatusEnum.uploading


class DocumentResponse(DocumentBase):
    """Schema for document response."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID
    status: DocumentStatusEnum
    chunk_count: int = Field(default=0, description="Number of indexed chunks")
    error_message: str | None = Field(
        default=None, description="Error message if processing failed"
    )
    created_at: datetime
    updated_at: datetime


class DocumentListResponse(BaseModel):
    """Schema for document list response."""

    data: list[DocumentResponse]
    total: int = Field(..., description="Total number of documents")


class DocumentUploadResponse(BaseModel):
    """Schema for document upload response."""

    id: UUID = Field(..., description="Document ID")
    filename: str = Field(..., description="Slugified filename")
    original_filename: str = Field(..., description="Original uploaded filename")
    file_type: str = Field(..., description="File extension")
    file_size_bytes: int = Field(..., description="File size in bytes")
    status: DocumentStatusEnum = Field(
        ..., description="Current processing status"
    )
    message: str = Field(..., description="Status message")


class DocumentDeleteResponse(BaseModel):
    """Schema for document deletion response."""

    id: UUID = Field(..., description="Deleted document ID")
    message: str = Field(..., description="Deletion confirmation message")


class DuplicateDocumentResponse(BaseModel):
    """Schema for duplicate document detection response."""

    is_duplicate: bool = Field(..., description="Whether file hash exists")
    existing_document_id: UUID | None = Field(
        default=None, description="ID of existing document with same hash"
    )
    existing_filename: str | None = Field(
        default=None, description="Filename of existing document"
    )


class DocumentProcessingStatus(BaseModel):
    """Schema for document processing status."""

    id: UUID
    status: DocumentStatusEnum
    chunk_count: int = 0
    error_message: str | None = None
    progress_message: str | None = None
