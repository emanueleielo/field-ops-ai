"""Text extraction for plain text formats (TXT, MD, HTML)."""

import html
import re
from pathlib import Path

from app.services.extractors.base import (
    BaseExtractor,
    ExtractionError,
    ExtractionResult,
)


class TextExtractor(BaseExtractor):
    """Extract text from plain text formats: TXT, MD, HTML."""

    # Common encodings to try
    ENCODINGS = ["utf-8", "utf-8-sig", "latin-1", "cp1252"]

    def extract(self, file_path: Path) -> ExtractionResult:
        """Extract text from a text file.

        Args:
            file_path: Path to the text file.

        Returns:
            ExtractionResult containing the text content.

        Raises:
            ExtractionError: If extraction fails.
        """
        try:
            content = self._read_file_with_encoding(file_path)
            return self._process_content(content, file_path.suffix.lower())
        except Exception as e:
            raise ExtractionError(f"Failed to extract text from file: {e}") from e

    def extract_from_bytes(self, content: bytes, filename: str) -> ExtractionResult:
        """Extract text from bytes.

        Args:
            content: File content as bytes.
            filename: Original filename for format detection.

        Returns:
            ExtractionResult containing the text content.

        Raises:
            ExtractionError: If extraction fails.
        """
        try:
            text = self._decode_bytes(content)
            suffix = Path(filename).suffix.lower()
            return self._process_content(text, suffix)
        except Exception as e:
            raise ExtractionError(f"Failed to extract text from bytes: {e}") from e

    def _read_file_with_encoding(self, file_path: Path) -> str:
        """Read file trying multiple encodings.

        Args:
            file_path: Path to the file.

        Returns:
            File content as string.

        Raises:
            ExtractionError: If file cannot be decoded.
        """
        for encoding in self.ENCODINGS:
            try:
                return file_path.read_text(encoding=encoding)
            except UnicodeDecodeError:
                continue

        raise ExtractionError(
            f"Could not decode file with any of: {', '.join(self.ENCODINGS)}"
        )

    def _decode_bytes(self, content: bytes) -> str:
        """Decode bytes trying multiple encodings.

        Args:
            content: Bytes to decode.

        Returns:
            Decoded string.

        Raises:
            ExtractionError: If bytes cannot be decoded.
        """
        for encoding in self.ENCODINGS:
            try:
                return content.decode(encoding)
            except UnicodeDecodeError:
                continue

        raise ExtractionError(
            f"Could not decode bytes with any of: {', '.join(self.ENCODINGS)}"
        )

    def _process_content(self, content: str, suffix: str) -> ExtractionResult:
        """Process content based on file type.

        Args:
            content: Raw text content.
            suffix: File suffix (e.g., '.html', '.md', '.txt').

        Returns:
            ExtractionResult with processed text.
        """
        if suffix in (".html", ".htm"):
            text = self._strip_html(content)
        else:
            # TXT and MD are kept as-is
            text = content

        # Normalize whitespace
        text = self._normalize_whitespace(text)

        return ExtractionResult(
            text=text,
            page_count=1,
            metadata={},
        )

    def _strip_html(self, content: str) -> str:
        """Strip HTML tags and decode entities.

        Args:
            content: HTML content.

        Returns:
            Plain text without HTML tags.
        """
        # Remove script and style elements
        content = re.sub(r"<script[^>]*>.*?</script>", "", content, flags=re.DOTALL)
        content = re.sub(r"<style[^>]*>.*?</style>", "", content, flags=re.DOTALL)

        # Remove HTML comments
        content = re.sub(r"<!--.*?-->", "", content, flags=re.DOTALL)

        # Replace block elements with newlines
        block_elements = r"</?(p|div|br|h[1-6]|li|tr|td|th|table|section|article)[^>]*>"
        content = re.sub(block_elements, "\n", content, flags=re.IGNORECASE)

        # Remove remaining HTML tags
        content = re.sub(r"<[^>]+>", "", content)

        # Decode HTML entities
        content = html.unescape(content)

        return content

    def _normalize_whitespace(self, text: str) -> str:
        """Normalize whitespace in text.

        Args:
            text: Input text.

        Returns:
            Text with normalized whitespace.
        """
        # Replace multiple spaces with single space
        text = re.sub(r"[ \t]+", " ", text)

        # Replace multiple newlines with double newline
        text = re.sub(r"\n{3,}", "\n\n", text)

        # Strip leading/trailing whitespace from each line
        lines = [line.strip() for line in text.split("\n")]
        text = "\n".join(lines)

        return text.strip()
