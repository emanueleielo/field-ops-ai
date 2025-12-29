"""Storage service using Supabase Storage."""

from typing import BinaryIO
from uuid import UUID

from app.services.supabase_client import get_supabase_client

# Supabase Storage bucket name for documents
DOCUMENTS_BUCKET = "documents"


class StorageError(Exception):
    """Exception raised for storage operations."""


class StorageService:
    """Service for managing file storage on Supabase Storage.

    Files are stored in: documents/{org_id}/{document_id}/{filename}
    """

    def __init__(self) -> None:
        """Initialize the storage service."""
        self._client = get_supabase_client()
        self._ensure_bucket_exists()

    def _ensure_bucket_exists(self) -> None:
        """Ensure the documents bucket exists, create if not."""
        try:
            # Try to get bucket info
            self._client.storage.get_bucket(DOCUMENTS_BUCKET)
        except Exception:
            # Bucket doesn't exist, create it
            try:
                self._client.storage.create_bucket(
                    DOCUMENTS_BUCKET,
                    options={
                        "public": False,
                        "file_size_limit": 52428800,  # 50MB
                    },
                )
            except Exception as e:
                # Bucket may already exist (race condition) or other error
                if "already exists" not in str(e).lower():
                    raise StorageError(f"Failed to create storage bucket: {e}") from e

    def _get_storage_path(
        self, org_id: UUID, document_id: UUID, filename: str
    ) -> str:
        """Generate storage path for a file.

        Args:
            org_id: Organization ID.
            document_id: Document ID.
            filename: Slugified filename.

        Returns:
            Storage path: {org_id}/{document_id}/{filename}
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
            file_content = file.read()
            self._client.storage.from_(DOCUMENTS_BUCKET).upload(
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
            self._client.storage.from_(DOCUMENTS_BUCKET).remove([storage_path])
        except Exception as e:
            raise StorageError(f"Failed to delete file: {e}") from e

    def delete_document_folder(self, org_id: UUID, document_id: UUID) -> None:
        """Delete all files in a document folder.

        Args:
            org_id: Organization ID.
            document_id: Document ID.

        Raises:
            StorageError: If deletion fails.
        """
        folder_path = f"{org_id}/{document_id}"

        try:
            # List all files in the folder
            files = self._client.storage.from_(DOCUMENTS_BUCKET).list(folder_path)

            if files:
                # Build full paths for all files
                file_paths = [f"{folder_path}/{f['name']}" for f in files]
                self._client.storage.from_(DOCUMENTS_BUCKET).remove(file_paths)
        except Exception as e:
            raise StorageError(f"Failed to delete document folder: {e}") from e

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
            response = self._client.storage.from_(DOCUMENTS_BUCKET).download(
                storage_path
            )
            return response
        except Exception as e:
            raise StorageError(f"Failed to download file: {e}") from e

    def get_signed_url(self, storage_path: str, expires_in: int = 3600) -> str:
        """Get a signed URL for temporary file access.

        Args:
            storage_path: Path of the file.
            expires_in: URL expiration time in seconds (default 1 hour).

        Returns:
            Signed URL for file access.

        Raises:
            StorageError: If URL generation fails.
        """
        try:
            result = self._client.storage.from_(DOCUMENTS_BUCKET).create_signed_url(
                storage_path, expires_in
            )
            return result["signedURL"]
        except Exception as e:
            raise StorageError(f"Failed to generate signed URL: {e}") from e

    def file_exists(self, storage_path: str) -> bool:
        """Check if a file exists in storage.

        Args:
            storage_path: Path of the file.

        Returns:
            True if file exists, False otherwise.
        """
        try:
            # Try to get file info by listing the parent folder
            parts = storage_path.rsplit("/", 1)
            if len(parts) == 2:
                folder, filename = parts
                files = self._client.storage.from_(DOCUMENTS_BUCKET).list(folder)
                return any(f["name"] == filename for f in files)
            return False
        except Exception:
            return False

    def get_file_size(self, storage_path: str) -> int:
        """Get the size of a stored file in bytes.

        Args:
            storage_path: Path of the file.

        Returns:
            File size in bytes.

        Raises:
            StorageError: If file doesn't exist or size cannot be determined.
        """
        try:
            parts = storage_path.rsplit("/", 1)
            if len(parts) == 2:
                folder, filename = parts
                files = self._client.storage.from_(DOCUMENTS_BUCKET).list(folder)
                for f in files:
                    if f["name"] == filename:
                        metadata = f.get("metadata", {})
                        return metadata.get("size", 0)
            raise StorageError(f"File not found: {storage_path}")
        except StorageError:
            raise
        except Exception as e:
            raise StorageError(f"Failed to get file size: {e}") from e
