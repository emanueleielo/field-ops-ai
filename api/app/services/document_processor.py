"""Document processing pipeline for upload, extraction, chunking, and indexing."""

import hashlib
import logging
from dataclasses import dataclass
from typing import Any, BinaryIO
from uuid import UUID

from slugify import slugify

from app.models.enums import TierEnum
from app.services.extractors import (
    DocxExtractor,
    ExtractionError,
    ExtractionResult,
    PDFExtractor,
    SpreadsheetExtractor,
    TextExtractor,
)
from app.services.storage import StorageService
from app.services.vector_store import VectorStoreError, VectorStoreService

logger = logging.getLogger(__name__)


class DocumentProcessingError(Exception):
    """Exception raised during document processing."""


@dataclass
class Chunk:
    """Represents a text chunk from a document."""

    content: str
    chunk_index: int
    page_number: int | None = None
    section_title: str | None = None


@dataclass
class ValidationResult:
    """Result of file validation."""

    is_valid: bool
    error_message: str | None = None


@dataclass
class ProcessingResult:
    """Result of document processing."""

    success: bool
    chunk_count: int = 0
    error_message: str | None = None


# Supported file types and their MIME types
SUPPORTED_FILE_TYPES: dict[str, list[str]] = {
    "pdf": ["application/pdf"],
    "docx": [
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ],
    "txt": ["text/plain"],
    "md": ["text/markdown", "text/x-markdown", "text/plain"],
    "html": ["text/html"],
    "htm": ["text/html"],
    "xlsx": [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ],
    "csv": ["text/csv", "application/csv", "text/plain"],
}

# Tier-based limits
TIER_LIMITS: dict[TierEnum, dict[str, int | None]] = {
    TierEnum.basic: {
        "storage_limit_mb": 50,
        "max_file_size_mb": 50,
        "max_pdf_pages": 1000,
    },
    TierEnum.professional: {
        "storage_limit_mb": None,  # Unlimited
        "max_file_size_mb": 100,
        "max_pdf_pages": 2000,
    },
    TierEnum.enterprise: {
        "storage_limit_mb": None,  # Unlimited
        "max_file_size_mb": 100,
        "max_pdf_pages": 2000,
    },
}


class DocumentProcessor:
    """Handles document upload, validation, extraction, chunking, and indexing."""

    # Chunking parameters
    CHUNK_SIZE = 1000  # characters
    CHUNK_OVERLAP = 150  # 15% overlap

    def __init__(self, skip_services: bool = False) -> None:
        """Initialize the document processor.

        Args:
            skip_services: If True, skip initializing storage and vector store
                services. Useful for validation-only operations.
        """
        self._storage_service: StorageService | None = None
        self._vector_store: VectorStoreService | None = None
        self._skip_services = skip_services

        # Initialize extractors
        self.pdf_extractor = PDFExtractor()
        self.docx_extractor = DocxExtractor()
        self.text_extractor = TextExtractor()
        self.spreadsheet_extractor = SpreadsheetExtractor()

    @property
    def storage_service(self) -> StorageService:
        """Get or create storage service."""
        if self._storage_service is None:
            self._storage_service = StorageService()
        return self._storage_service

    @property
    def vector_store(self) -> VectorStoreService:
        """Get or create vector store service."""
        if self._vector_store is None:
            self._vector_store = VectorStoreService()
        return self._vector_store

    def validate_file(
        self,
        filename: str,
        file_size: int,
        content_type: str,
        tier: TierEnum,
        current_storage_mb: int,
    ) -> ValidationResult:
        """Validate a file before upload.

        Args:
            filename: Original filename.
            file_size: File size in bytes.
            content_type: MIME type of the file.
            tier: Organization tier for limit checking.
            current_storage_mb: Current storage used in MB.

        Returns:
            ValidationResult indicating if file is valid.
        """
        # Get file extension
        extension = self._get_extension(filename)
        if not extension:
            return ValidationResult(
                is_valid=False,
                error_message="File must have an extension",
            )

        # Check if file type is supported
        if extension not in SUPPORTED_FILE_TYPES:
            supported = ", ".join(SUPPORTED_FILE_TYPES.keys())
            return ValidationResult(
                is_valid=False,
                error_message=f"Unsupported file type. Supported: {supported}",
            )

        # Check MIME type matches extension
        valid_mimes = SUPPORTED_FILE_TYPES[extension]
        if content_type not in valid_mimes and content_type != "application/octet-stream":
            return ValidationResult(
                is_valid=False,
                error_message=f"Invalid content type for {extension} file",
            )

        # Get tier limits
        limits = TIER_LIMITS[tier]

        # Check file size
        max_file_size_bytes = (limits["max_file_size_mb"] or 100) * 1024 * 1024
        if file_size > max_file_size_bytes:
            return ValidationResult(
                is_valid=False,
                error_message=f"File too large. Maximum: {limits['max_file_size_mb']}MB",
            )

        # Check storage limit
        storage_limit = limits["storage_limit_mb"]
        if storage_limit is not None:
            file_size_mb = file_size / (1024 * 1024)
            if current_storage_mb + file_size_mb > storage_limit:
                return ValidationResult(
                    is_valid=False,
                    error_message=f"Storage limit exceeded. Maximum: {storage_limit}MB",
                )

        # Check filename length
        if len(filename) > 255:
            return ValidationResult(
                is_valid=False,
                error_message="Filename too long. Maximum: 255 characters",
            )

        return ValidationResult(is_valid=True)

    def compute_hash(self, file: BinaryIO) -> str:
        """Compute SHA256 hash of file content.

        Args:
            file: File-like object to hash.

        Returns:
            SHA256 hash as hex string.
        """
        sha256 = hashlib.sha256()
        file.seek(0)

        for chunk in iter(lambda: file.read(8192), b""):
            sha256.update(chunk)

        file.seek(0)  # Reset file position
        return sha256.hexdigest()

    def slugify_filename(self, filename: str) -> str:
        """Convert filename to URL-safe slug while preserving extension.

        Args:
            filename: Original filename.

        Returns:
            Slugified filename with original extension.
        """
        extension = self._get_extension(filename)
        name = filename.rsplit(".", 1)[0] if "." in filename else filename

        # Slugify the name part
        slugified_name = slugify(name, max_length=200, lowercase=True)

        if extension:
            return f"{slugified_name}.{extension}"
        return slugified_name

    def extract_text(self, content: bytes, filename: str) -> ExtractionResult:
        """Extract text from document content.

        Args:
            content: Document content as bytes.
            filename: Original filename for format detection.

        Returns:
            ExtractionResult with extracted text.

        Raises:
            DocumentProcessingError: If extraction fails.
        """
        extension = self._get_extension(filename)

        try:
            if extension == "pdf":
                return self.pdf_extractor.extract_from_bytes(content, filename)
            elif extension == "docx":
                return self.docx_extractor.extract_from_bytes(content, filename)
            elif extension in ("txt", "md", "html", "htm"):
                return self.text_extractor.extract_from_bytes(content, filename)
            elif extension in ("xlsx", "csv"):
                return self.spreadsheet_extractor.extract_from_bytes(content, filename)
            else:
                raise DocumentProcessingError(f"Unsupported file type: {extension}")
        except ExtractionError as e:
            raise DocumentProcessingError(str(e)) from e

    def chunk_text(
        self,
        text: str,
        chunk_size: int = CHUNK_SIZE,
        overlap: int = CHUNK_OVERLAP,
    ) -> list[Chunk]:
        """Split text into overlapping chunks.

        Args:
            text: Full text to chunk.
            chunk_size: Maximum characters per chunk.
            overlap: Number of overlapping characters between chunks.

        Returns:
            List of Chunk objects.
        """
        if not text:
            return []

        chunks: list[Chunk] = []
        current_page = 1
        current_section = ""

        # Track page numbers from markers like [Page N]
        lines = text.split("\n")
        processed_text = ""

        for line in lines:
            if line.startswith("[Page "):
                try:
                    current_page = int(line.replace("[Page ", "").replace("]", ""))
                    continue  # Skip the page marker line
                except ValueError:
                    pass

            # Track section headers (lines starting with ## or #)
            if line.startswith("## "):
                current_section = line.replace("## ", "").strip()
            elif line.startswith("# "):
                current_section = line.replace("# ", "").strip()

            processed_text += line + "\n"

        # Split into chunks with overlap
        text = processed_text.strip()
        start = 0
        chunk_index = 0

        while start < len(text):
            end = start + chunk_size

            # Try to break at sentence or word boundary
            if end < len(text):
                # Look for sentence boundary
                for boundary in [". ", ".\n", "! ", "!\n", "? ", "?\n"]:
                    pos = text.rfind(boundary, start + chunk_size // 2, end)
                    if pos != -1:
                        end = pos + len(boundary)
                        break
                else:
                    # Look for word boundary
                    pos = text.rfind(" ", start + chunk_size // 2, end)
                    if pos != -1:
                        end = pos + 1

            chunk_text = text[start:end].strip()
            if chunk_text:
                chunks.append(
                    Chunk(
                        content=chunk_text,
                        chunk_index=chunk_index,
                        page_number=current_page,
                        section_title=current_section or None,
                    )
                )
                chunk_index += 1

            # Move start position accounting for overlap
            start = end - overlap if end < len(text) else len(text)

        return chunks

    async def process_document(
        self,
        org_id: UUID,
        document_id: UUID,
        content: bytes,
        filename: str,
    ) -> ProcessingResult:
        """Process a document: extract text, chunk, embed, and index.

        This is the main orchestrator method that handles the full pipeline.

        Args:
            org_id: Organization ID.
            document_id: Document ID.
            content: Document content as bytes.
            filename: Original filename.

        Returns:
            ProcessingResult indicating success or failure.
        """
        try:
            # Extract text
            logger.info(f"Extracting text from document {document_id}")
            extraction_result = self.extract_text(content, filename)

            if not extraction_result.text:
                return ProcessingResult(
                    success=False,
                    error_message="No text could be extracted from document",
                )

            # Chunk the text
            logger.info(f"Chunking document {document_id}")
            chunks = self.chunk_text(extraction_result.text)

            if not chunks:
                return ProcessingResult(
                    success=False,
                    error_message="Document produced no text chunks",
                )

            # Convert chunks to format expected by vector store
            chunk_data: list[dict[str, Any]] = [
                {
                    "content": chunk.content,
                    "chunk_index": chunk.chunk_index,
                    "page_number": chunk.page_number,
                    "section_title": chunk.section_title,
                }
                for chunk in chunks
            ]

            # Index in vector store
            logger.info(f"Indexing {len(chunks)} chunks for document {document_id}")
            await self.vector_store.upsert_chunks(org_id, document_id, chunk_data)

            return ProcessingResult(
                success=True,
                chunk_count=len(chunks),
            )

        except (VectorStoreError, DocumentProcessingError) as e:
            logger.exception(f"Error processing document {document_id}: {e}")
            return ProcessingResult(
                success=False,
                error_message=str(e),
            )
        except Exception as e:
            logger.exception(f"Unexpected error processing document {document_id}: {e}")
            return ProcessingResult(
                success=False,
                error_message=f"Unexpected error: {e}",
            )

    async def delete_document_data(self, org_id: UUID, document_id: UUID) -> None:
        """Delete document data from vector store.

        Args:
            org_id: Organization ID.
            document_id: Document ID.

        Raises:
            DocumentProcessingError: If deletion fails.
        """
        try:
            await self.vector_store.delete_document(org_id, document_id)
        except VectorStoreError as e:
            raise DocumentProcessingError(f"Failed to delete document data: {e}") from e

    def _get_extension(self, filename: str) -> str:
        """Extract file extension from filename.

        Args:
            filename: Original filename.

        Returns:
            Lowercase extension without dot, or empty string.
        """
        if "." not in filename:
            return ""
        return filename.rsplit(".", 1)[-1].lower()

    def get_content_type(self, filename: str) -> str:
        """Get MIME type for a filename.

        Args:
            filename: Filename to check.

        Returns:
            MIME type string.
        """
        extension = self._get_extension(filename)
        mime_types = {
            "pdf": "application/pdf",
            "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "txt": "text/plain",
            "md": "text/markdown",
            "html": "text/html",
            "htm": "text/html",
            "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "csv": "text/csv",
        }
        return mime_types.get(extension, "application/octet-stream")
