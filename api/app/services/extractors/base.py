"""Base extractor class and common types."""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from pathlib import Path


class ExtractionError(Exception):
    """Exception raised during text extraction."""


@dataclass
class ExtractionResult:
    """Result of text extraction from a document."""

    text: str
    page_count: int = 1
    metadata: dict[str, str] = field(default_factory=dict)


class BaseExtractor(ABC):
    """Abstract base class for document text extractors."""

    @abstractmethod
    def extract(self, file_path: Path) -> ExtractionResult:
        """Extract text from a document file.

        Args:
            file_path: Path to the document file.

        Returns:
            ExtractionResult containing extracted text and metadata.

        Raises:
            ExtractionError: If extraction fails.
        """

    @abstractmethod
    def extract_from_bytes(self, content: bytes, filename: str) -> ExtractionResult:
        """Extract text from document bytes.

        Args:
            content: Document content as bytes.
            filename: Original filename for format detection.

        Returns:
            ExtractionResult containing extracted text and metadata.

        Raises:
            ExtractionError: If extraction fails.
        """
