"""PDF text extraction using pypdf."""

from io import BytesIO
from pathlib import Path

from pypdf import PdfReader

from app.services.extractors.base import (
    BaseExtractor,
    ExtractionError,
    ExtractionResult,
)


class PDFExtractor(BaseExtractor):
    """Extract text from PDF documents (text-based only, no OCR)."""

    def extract(self, file_path: Path) -> ExtractionResult:
        """Extract text from a PDF file.

        Args:
            file_path: Path to the PDF file.

        Returns:
            ExtractionResult containing extracted text and page count.

        Raises:
            ExtractionError: If extraction fails.
        """
        try:
            with open(file_path, "rb") as f:
                return self._extract_from_reader(PdfReader(f))
        except Exception as e:
            raise ExtractionError(f"Failed to extract text from PDF: {e}") from e

    def extract_from_bytes(self, content: bytes, filename: str) -> ExtractionResult:
        """Extract text from PDF bytes.

        Args:
            content: PDF content as bytes.
            filename: Original filename (unused for PDF).

        Returns:
            ExtractionResult containing extracted text and page count.

        Raises:
            ExtractionError: If extraction fails.
        """
        try:
            reader = PdfReader(BytesIO(content))
            return self._extract_from_reader(reader)
        except Exception as e:
            raise ExtractionError(f"Failed to extract text from PDF: {e}") from e

    def _extract_from_reader(self, reader: PdfReader) -> ExtractionResult:
        """Extract text from a PdfReader instance.

        Args:
            reader: PdfReader instance.

        Returns:
            ExtractionResult containing extracted text and page count.
        """
        pages_text: list[str] = []
        page_count = len(reader.pages)

        for page_num, page in enumerate(reader.pages, start=1):
            text = page.extract_text()
            if text:
                # Add page marker for section tracking
                pages_text.append(f"[Page {page_num}]\n{text}")

        full_text = "\n\n".join(pages_text)

        # Extract metadata
        metadata: dict[str, str] = {}
        if reader.metadata:
            if reader.metadata.title:
                metadata["title"] = str(reader.metadata.title)
            if reader.metadata.author:
                metadata["author"] = str(reader.metadata.author)
            if reader.metadata.subject:
                metadata["subject"] = str(reader.metadata.subject)

        return ExtractionResult(
            text=full_text,
            page_count=page_count,
            metadata=metadata,
        )
