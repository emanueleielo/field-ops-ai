"""Storage service using Supabase Storage."""

from typing import BinaryIO
from uuid import UUID

from supabase import create_client
from supabase.client import Client

from app.config import get_settings


class StorageError(Exception):
    """Exception raised for storage operations."""


class StorageService:
    """Service for managing file storage in Supabase Storage."""

    BUCKET_NAME = "documents"

    def __init__(self) -> None:
        """Initialize the storage service with Supabase client."""
        settings = get_settings()
        if not settings.supabase_url or not settings.supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY must be configured")

        self.client: Client = create_client(
            settings.supabase_url,
            settings.supabase_key,
        )

    def _get_storage_path(self, org_id: UUID, document_id: UUID, filename: str) -> str:
        """Generate storage path for a file.

        Args:
            org_id: Organization ID.
            document_id: Document ID.
            filename: Slugified filename.

        Returns:
            Storage path in format: {org_id}/{document_id}/{filename}
        """
        return f"{org_id}/{document_id}/{filename}"

    def upload_file(
        self,
        org_id: UUID,
        document_id: UUID,
        filename: str,
        file: BinaryIO,
        content_type: str,
    ) -> str:
        """Upload a file to Supabase Storage.

        Args:
            org_id: Organization ID.
            document_id: Document ID.
            filename: Slugified filename.
            file: File-like object to upload.
            content_type: MIME type of the file.

        Returns:
            Storage path of the uploaded file.

        Raises:
            StorageError: If upload fails.
        """
        storage_path = self._get_storage_path(org_id, document_id, filename)

        try:
            # Read file content
            file_content = file.read()

            # Upload to Supabase Storage
            self.client.storage.from_(self.BUCKET_NAME).upload(
                path=storage_path,
                file=file_content,
                file_options={"content-type": content_type},
            )

            return storage_path
        except Exception as e:
            raise StorageError(f"Failed to upload file: {e}") from e

    def delete_file(self, storage_path: str) -> None:
        """Delete a file from Supabase Storage.

        Args:
            storage_path: Path of the file to delete.

        Raises:
            StorageError: If deletion fails.
        """
        try:
            self.client.storage.from_(self.BUCKET_NAME).remove([storage_path])
        except Exception as e:
            raise StorageError(f"Failed to delete file: {e}") from e

    def get_file_url(self, storage_path: str, expires_in: int = 3600) -> str:
        """Get a signed URL for accessing a file.

        Args:
            storage_path: Path of the file.
            expires_in: URL expiration time in seconds (default: 1 hour).

        Returns:
            Signed URL for file access.

        Raises:
            StorageError: If URL generation fails.
        """
        try:
            response = self.client.storage.from_(self.BUCKET_NAME).create_signed_url(
                path=storage_path,
                expires_in=expires_in,
            )
            return response["signedURL"]
        except Exception as e:
            raise StorageError(f"Failed to generate signed URL: {e}") from e

    def download_file(self, storage_path: str) -> bytes:
        """Download a file from Supabase Storage.

        Args:
            storage_path: Path of the file to download.

        Returns:
            File content as bytes.

        Raises:
            StorageError: If download fails.
        """
        try:
            response = self.client.storage.from_(self.BUCKET_NAME).download(
                path=storage_path,
            )
            return response
        except Exception as e:
            raise StorageError(f"Failed to download file: {e}") from e
