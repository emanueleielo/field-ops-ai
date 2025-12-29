"""Spreadsheet text extraction for XLSX and CSV files."""

from io import BytesIO, StringIO
from pathlib import Path
from typing import Any

import pandas as pd

from app.services.extractors.base import (
    BaseExtractor,
    ExtractionError,
    ExtractionResult,
)


class SpreadsheetExtractor(BaseExtractor):
    """Extract text from spreadsheet formats: XLSX, CSV."""

    # Common encodings for CSV
    CSV_ENCODINGS = ["utf-8", "utf-8-sig", "latin-1", "cp1252"]

    def extract(self, file_path: Path) -> ExtractionResult:
        """Extract text from a spreadsheet file.

        Args:
            file_path: Path to the spreadsheet file.

        Returns:
            ExtractionResult containing the tabular data as text.

        Raises:
            ExtractionError: If extraction fails.
        """
        suffix = file_path.suffix.lower()
        try:
            if suffix == ".xlsx":
                return self._extract_xlsx(file_path)
            elif suffix == ".csv":
                return self._extract_csv_file(file_path)
            else:
                raise ExtractionError(f"Unsupported spreadsheet format: {suffix}")
        except Exception as e:
            if isinstance(e, ExtractionError):
                raise
            raise ExtractionError(f"Failed to extract spreadsheet: {e}") from e

    def extract_from_bytes(self, content: bytes, filename: str) -> ExtractionResult:
        """Extract text from spreadsheet bytes.

        Args:
            content: Spreadsheet content as bytes.
            filename: Original filename for format detection.

        Returns:
            ExtractionResult containing the tabular data as text.

        Raises:
            ExtractionError: If extraction fails.
        """
        suffix = Path(filename).suffix.lower()
        try:
            if suffix == ".xlsx":
                return self._extract_xlsx_bytes(content)
            elif suffix == ".csv":
                return self._extract_csv_bytes(content)
            else:
                raise ExtractionError(f"Unsupported spreadsheet format: {suffix}")
        except Exception as e:
            if isinstance(e, ExtractionError):
                raise
            raise ExtractionError(f"Failed to extract spreadsheet: {e}") from e

    def _extract_xlsx(self, file_path: Path) -> ExtractionResult:
        """Extract text from an Excel file.

        Args:
            file_path: Path to the Excel file.

        Returns:
            ExtractionResult with all sheets as text.
        """
        excel_file = pd.ExcelFile(file_path)
        return self._process_excel(excel_file)

    def _extract_xlsx_bytes(self, content: bytes) -> ExtractionResult:
        """Extract text from Excel bytes.

        Args:
            content: Excel file content as bytes.

        Returns:
            ExtractionResult with all sheets as text.
        """
        excel_file = pd.ExcelFile(BytesIO(content))
        return self._process_excel(excel_file)

    def _process_excel(self, excel_file: pd.ExcelFile) -> ExtractionResult:
        """Process an Excel file and extract text from all sheets.

        Args:
            excel_file: pandas ExcelFile object.

        Returns:
            ExtractionResult with all sheets as text.
        """
        sheets_text: list[str] = []
        sheet_count = len(excel_file.sheet_names)

        for sheet_name in excel_file.sheet_names:
            df = pd.read_excel(excel_file, sheet_name=sheet_name)
            sheet_text = self._dataframe_to_text(df, sheet_name)
            if sheet_text:
                sheets_text.append(sheet_text)

        full_text = "\n\n".join(sheets_text)

        return ExtractionResult(
            text=full_text,
            page_count=sheet_count,
            metadata={"sheet_count": str(sheet_count)},
        )

    def _extract_csv_file(self, file_path: Path) -> ExtractionResult:
        """Extract text from a CSV file.

        Args:
            file_path: Path to the CSV file.

        Returns:
            ExtractionResult with CSV data as text.
        """
        df = self._read_csv_with_encoding(file_path)
        return self._process_csv(df)

    def _extract_csv_bytes(self, content: bytes) -> ExtractionResult:
        """Extract text from CSV bytes.

        Args:
            content: CSV content as bytes.

        Returns:
            ExtractionResult with CSV data as text.
        """
        df = self._decode_csv_bytes(content)
        return self._process_csv(df)

    def _read_csv_with_encoding(self, file_path: Path) -> pd.DataFrame:
        """Read CSV file trying multiple encodings.

        Args:
            file_path: Path to the CSV file.

        Returns:
            DataFrame with CSV data.

        Raises:
            ExtractionError: If CSV cannot be decoded.
        """
        for encoding in self.CSV_ENCODINGS:
            try:
                return pd.read_csv(file_path, encoding=encoding)
            except UnicodeDecodeError:
                continue
            except pd.errors.ParserError:
                # Try with different delimiter
                for delimiter in [",", ";", "\t", "|"]:
                    try:
                        return pd.read_csv(
                            file_path, encoding=encoding, delimiter=delimiter
                        )
                    except (UnicodeDecodeError, pd.errors.ParserError):
                        continue

        raise ExtractionError(
            f"Could not parse CSV with encodings: {', '.join(self.CSV_ENCODINGS)}"
        )

    def _decode_csv_bytes(self, content: bytes) -> pd.DataFrame:
        """Decode CSV bytes trying multiple encodings.

        Args:
            content: CSV content as bytes.

        Returns:
            DataFrame with CSV data.

        Raises:
            ExtractionError: If CSV cannot be decoded.
        """
        for encoding in self.CSV_ENCODINGS:
            try:
                text = content.decode(encoding)
                return pd.read_csv(StringIO(text))
            except UnicodeDecodeError:
                continue
            except pd.errors.ParserError:
                # Try with different delimiter
                for delimiter in [",", ";", "\t", "|"]:
                    try:
                        return pd.read_csv(StringIO(text), delimiter=delimiter)
                    except pd.errors.ParserError:
                        continue

        raise ExtractionError(
            f"Could not parse CSV with encodings: {', '.join(self.CSV_ENCODINGS)}"
        )

    def _process_csv(self, df: pd.DataFrame) -> ExtractionResult:
        """Process a CSV DataFrame.

        Args:
            df: pandas DataFrame.

        Returns:
            ExtractionResult with CSV data as text.
        """
        text = self._dataframe_to_text(df)

        return ExtractionResult(
            text=text,
            page_count=1,
            metadata={"row_count": str(len(df))},
        )

    def _dataframe_to_text(
        self, df: pd.DataFrame, sheet_name: str | None = None
    ) -> str:
        """Convert DataFrame to readable text format.

        Args:
            df: pandas DataFrame.
            sheet_name: Optional sheet name for Excel files.

        Returns:
            Text representation of the DataFrame.
        """
        if df.empty:
            return ""

        lines: list[str] = []

        # Add sheet name header if provided
        if sheet_name:
            lines.append(f"[Sheet: {sheet_name}]")

        # Add column headers
        headers = " | ".join(str(col) for col in df.columns)
        lines.append(headers)
        lines.append("-" * len(headers))

        # Add data rows
        for _, row in df.iterrows():
            row_values: list[str] = []
            for val in row.values:
                row_values.append(self._format_cell_value(val))
            lines.append(" | ".join(row_values))

        return "\n".join(lines)

    def _format_cell_value(self, value: Any) -> str:
        """Format a cell value as string.

        Args:
            value: Cell value.

        Returns:
            Formatted string value.
        """
        if pd.isna(value):
            return ""
        if isinstance(value, float):
            # Remove trailing zeros
            formatted = f"{value:.6f}".rstrip("0").rstrip(".")
            return formatted
        return str(value).strip()
