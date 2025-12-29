"""Document management endpoints."""

import logging
from uuid import UUID, uuid4

from fastapi import APIRouter, BackgroundTasks, Depends, File, Query, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.schemas.document import (
    DocumentDeleteResponse,
    DocumentListResponse,
    DocumentResponse,
    DocumentUploadResponse,
    DuplicateDocumentResponse,
)
from app.core.exceptions import NotFoundException, ValidationException
from app.db.session import get_db
from app.models.document import Document
from app.models.enums import DocumentStatusEnum
from app.models.organization import Organization
from app.services.document_processor import (
    DocumentProcessingError,
    DocumentProcessor,
)
from app.services.storage import StorageError, StorageService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/documents", tags=["documents"])


# TODO: Replace with actual auth dependency once auth is implemented
async def get_current_org_id() -> UUID:
    """Temporary dependency to get organization ID.

    This should be replaced with actual authentication that extracts
    the organization ID from the authenticated user's session.
    """
    # Placeholder: return a fixed UUID for development
    # In production, this will come from Supabase Auth
    return UUID("00000000-0000-0000-0000-000000000001")


async def process_document_background(
    org_id: UUID,
    document_id: UUID,
    content: bytes,
    filename: str,
) -> None:
    """Background task to process and index a document.

    Args:
        org_id: Organization ID.
        document_id: Document ID.
        content: Document content as bytes.
        filename: Original filename.
    """
    from app.db.session import get_async_session_factory

    session_factory = get_async_session_factory()
    async with session_factory() as db:
        try:
            # Update status to processing
            result = await db.execute(
                select(Document).where(Document.id == document_id)
            )
            document = result.scalar_one_or_none()
            if not document:
                logger.error(f"Document {document_id} not found for processing")
                return

            document.status = DocumentStatusEnum.processing
            await db.commit()

            # Process the document
            processor = DocumentProcessor()
            processing_result = await processor.process_document(
                org_id, document_id, content, filename
            )

            # Update document with result
            if processing_result.success:
                document.status = DocumentStatusEnum.indexed
                document.chunk_count = processing_result.chunk_count
                document.error_message = None
            else:
                document.status = DocumentStatusEnum.failed
                document.error_message = processing_result.error_message

            await db.commit()
            logger.info(
                f"Document {document_id} processing completed: "
                f"status={document.status.value}, chunks={document.chunk_count}"
            )

        except Exception as e:
            logger.exception(f"Error in background processing for document {document_id}")
            # Try to update status to failed
            try:
                result = await db.execute(
                    select(Document).where(Document.id == document_id)
                )
                document = result.scalar_one_or_none()
                if document:
                    document.status = DocumentStatusEnum.failed
                    document.error_message = str(e)
                    await db.commit()
            except Exception:
                logger.exception("Failed to update document status after error")


@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    org_id: UUID = Depends(get_current_org_id),
) -> DocumentUploadResponse:
    """Upload a document for processing and indexing.

    The document will be validated, stored, and then processed in the background.
    Processing includes text extraction, chunking, embedding, and indexing.

    Supported formats: PDF, DOCX, TXT, MD, HTML, XLSX, CSV
    """
    if not file.filename:
        raise ValidationException(detail="Filename is required")

    # Get organization for tier limits
    result = await db.execute(
        select(Organization).where(Organization.id == org_id)
    )
    organization = result.scalar_one_or_none()
    if not organization:
        raise NotFoundException(detail="Organization not found")

    # Calculate current storage usage
    storage_result = await db.execute(
        select(Document).where(Document.organization_id == org_id)
    )
    documents = storage_result.scalars().all()
    current_storage_mb = sum(d.file_size_bytes for d in documents) / (1024 * 1024)

    # Read file content
    content = await file.read()
    file_size = len(content)

    # Initialize processor for validation (skip services for now)
    processor = DocumentProcessor(skip_services=True)

    # Validate file
    validation = processor.validate_file(
        filename=file.filename,
        file_size=file_size,
        content_type=file.content_type or "application/octet-stream",
        tier=organization.tier,
        current_storage_mb=int(current_storage_mb),
    )

    if not validation.is_valid:
        raise ValidationException(detail=validation.error_message or "Invalid file")

    # Compute file hash for duplicate detection
    from io import BytesIO

    file_hash = processor.compute_hash(BytesIO(content))

    # Check for duplicate
    dup_result = await db.execute(
        select(Document).where(
            Document.organization_id == org_id,
            Document.file_hash == file_hash,
            Document.status != DocumentStatusEnum.failed,
        )
    )
    existing_doc = dup_result.scalar_one_or_none()
    if existing_doc:
        raise ValidationException(
            detail=f"Duplicate file detected. Existing document: {existing_doc.original_filename}",
            errors=[
                {
                    "type": "duplicate",
                    "existing_document_id": str(existing_doc.id),
                    "existing_filename": existing_doc.original_filename,
                }
            ],
        )

    # Generate document ID and slugified filename
    document_id = uuid4()
    slugified_filename = processor.slugify_filename(file.filename)
    file_type = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""

    # Upload to storage
    try:
        storage = StorageService()
        storage_path = storage.upload_file(
            org_id=org_id,
            document_id=document_id,
            filename=slugified_filename,
            file=BytesIO(content),
            content_type=file.content_type or processor.get_content_type(file.filename),
        )
    except StorageError as e:
        logger.exception(f"Storage error uploading document: {e}")
        raise ValidationException(detail=f"Failed to upload file: {e}") from e

    # Create document record
    document = Document(
        id=document_id,
        organization_id=org_id,
        filename=slugified_filename,
        original_filename=file.filename,
        file_type=file_type,
        file_size_bytes=file_size,
        file_hash=file_hash,
        storage_path=storage_path,
        status=DocumentStatusEnum.uploading,
    )
    db.add(document)
    await db.commit()
    await db.refresh(document)

    # Schedule background processing
    background_tasks.add_task(
        process_document_background,
        org_id,
        document_id,
        content,
        file.filename,
    )

    return DocumentUploadResponse(
        id=document.id,
        filename=document.filename,
        original_filename=document.original_filename,
        file_type=document.file_type,
        file_size_bytes=document.file_size_bytes,
        status=document.status,
        message="Document uploaded successfully. Processing started.",
    )


@router.get("", response_model=DocumentListResponse)
async def list_documents(
    db: AsyncSession = Depends(get_db),
    org_id: UUID = Depends(get_current_org_id),
    status: DocumentStatusEnum | None = Query(
        default=None, description="Filter by status"
    ),
    limit: int = Query(default=50, ge=1, le=100, description="Maximum results"),
    offset: int = Query(default=0, ge=0, description="Results offset"),
) -> DocumentListResponse:
    """List all documents for the organization.

    Returns documents ordered by creation date (newest first).
    """
    # Build query
    query = select(Document).where(Document.organization_id == org_id)

    if status:
        query = query.where(Document.status == status)

    # Get total count
    count_result = await db.execute(
        select(Document.id).where(Document.organization_id == org_id)
    )
    total = len(count_result.all())

    # Get paginated results
    query = query.order_by(Document.created_at.desc()).offset(offset).limit(limit)
    result = await db.execute(query)
    documents = result.scalars().all()

    return DocumentListResponse(
        data=[DocumentResponse.model_validate(doc) for doc in documents],
        total=total,
    )


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
    org_id: UUID = Depends(get_current_org_id),
) -> DocumentResponse:
    """Get a specific document by ID."""
    result = await db.execute(
        select(Document).where(
            Document.id == document_id,
            Document.organization_id == org_id,
        )
    )
    document = result.scalar_one_or_none()

    if not document:
        raise NotFoundException(detail="Document not found")

    return DocumentResponse.model_validate(document)


@router.get("/{document_id}/status", response_model=DocumentResponse)
async def get_document_status(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
    org_id: UUID = Depends(get_current_org_id),
) -> DocumentResponse:
    """Get document processing status.

    Use this endpoint to poll for processing completion.
    """
    result = await db.execute(
        select(Document).where(
            Document.id == document_id,
            Document.organization_id == org_id,
        )
    )
    document = result.scalar_one_or_none()

    if not document:
        raise NotFoundException(detail="Document not found")

    return DocumentResponse.model_validate(document)


@router.delete("/{document_id}", response_model=DocumentDeleteResponse)
async def delete_document(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
    org_id: UUID = Depends(get_current_org_id),
) -> DocumentDeleteResponse:
    """Delete a document and all its indexed data.

    This will:
    1. Remove the file from storage
    2. Remove all chunks from the vector store
    3. Delete the document record from the database
    """
    # Get document
    result = await db.execute(
        select(Document).where(
            Document.id == document_id,
            Document.organization_id == org_id,
        )
    )
    document = result.scalar_one_or_none()

    if not document:
        raise NotFoundException(detail="Document not found")

    # Delete from storage
    try:
        storage = StorageService()
        storage.delete_file(document.storage_path)
    except StorageError as e:
        logger.warning(f"Failed to delete file from storage: {e}")
        # Continue with deletion even if storage delete fails

    # Delete from vector store
    try:
        processor = DocumentProcessor()
        await processor.delete_document_data(org_id, document_id)
    except DocumentProcessingError as e:
        logger.warning(f"Failed to delete document from vector store: {e}")
        # Continue with deletion even if vector store delete fails

    # Delete from database
    await db.delete(document)
    await db.commit()

    return DocumentDeleteResponse(
        id=document_id,
        message="Document deleted successfully",
    )


@router.get("/check-duplicate/{file_hash}", response_model=DuplicateDocumentResponse)
async def check_duplicate(
    file_hash: str,
    db: AsyncSession = Depends(get_db),
    org_id: UUID = Depends(get_current_org_id),
) -> DuplicateDocumentResponse:
    """Check if a file with the given hash already exists.

    Use this before upload to detect duplicates without uploading.
    """
    result = await db.execute(
        select(Document).where(
            Document.organization_id == org_id,
            Document.file_hash == file_hash,
            Document.status != DocumentStatusEnum.failed,
        )
    )
    existing_doc = result.scalar_one_or_none()

    if existing_doc:
        return DuplicateDocumentResponse(
            is_duplicate=True,
            existing_document_id=existing_doc.id,
            existing_filename=existing_doc.original_filename,
        )

    return DuplicateDocumentResponse(is_duplicate=False)
