"""Vector store service using Qdrant."""

from typing import Any
from uuid import UUID

from qdrant_client import AsyncQdrantClient
from qdrant_client.http.exceptions import UnexpectedResponse
from qdrant_client.models import (
    Distance,
    FieldCondition,
    Filter,
    MatchValue,
    PointStruct,
    VectorParams,
)

from app.config import get_settings
from app.services.embedding import EmbeddingService


class VectorStoreError(Exception):
    """Exception raised for vector store operations."""


class VectorStoreService:
    """Service for managing document vectors in Qdrant."""

    COLLECTION_NAME = "documents"
    VECTOR_SIZE = 1536

    def __init__(self) -> None:
        """Initialize the vector store service with Qdrant client."""
        settings = get_settings()
        if not settings.qdrant_url:
            raise ValueError("QDRANT_URL is not configured")

        self.client = AsyncQdrantClient(
            url=settings.qdrant_url,
            api_key=settings.qdrant_api_key,
        )
        self.embedding_service = EmbeddingService()

    async def init_collection(self) -> None:
        """Create collection if it doesn't exist.

        Raises:
            VectorStoreError: If collection creation fails.
        """
        try:
            collections = await self.client.get_collections()
            exists = any(
                c.name == self.COLLECTION_NAME for c in collections.collections
            )

            if not exists:
                await self.client.create_collection(
                    collection_name=self.COLLECTION_NAME,
                    vectors_config=VectorParams(
                        size=self.VECTOR_SIZE,
                        distance=Distance.COSINE,
                    ),
                )
        except UnexpectedResponse as e:
            raise VectorStoreError(f"Failed to initialize collection: {e}") from e

    async def upsert_chunks(
        self,
        org_id: UUID,
        document_id: UUID,
        chunks: list[dict[str, Any]],
    ) -> int:
        """Insert or update document chunks.

        Args:
            org_id: Organization ID.
            document_id: Document ID.
            chunks: List of chunks with keys: content, chunk_index, page_number,
                section_title.

        Returns:
            Number of chunks upserted.

        Raises:
            VectorStoreError: If upsert operation fails.
        """
        if not chunks:
            return 0

        try:
            # Generate embeddings for all chunks
            texts = [chunk["content"] for chunk in chunks]
            embeddings = await self.embedding_service.embed_batch(texts)

            # Create points
            points = []
            for i, (chunk, embedding) in enumerate(zip(chunks, embeddings, strict=True)):
                chunk_index = chunk.get("chunk_index", i)
                point_id = f"{document_id}_{chunk_index}"
                points.append(
                    PointStruct(
                        id=point_id,
                        vector=embedding,
                        payload={
                            "org_id": str(org_id),
                            "document_id": str(document_id),
                            "chunk_index": chunk_index,
                            "page_number": chunk.get("page_number"),
                            "section_title": chunk.get("section_title", ""),
                            "content_raw": chunk["content"],
                        },
                    )
                )

            await self.client.upsert(
                collection_name=self.COLLECTION_NAME,
                points=points,
            )

            return len(points)
        except UnexpectedResponse as e:
            raise VectorStoreError(f"Failed to upsert chunks: {e}") from e

    async def search(
        self,
        org_id: UUID,
        query: str,
        limit: int = 5,
    ) -> list[dict[str, Any]]:
        """Search for similar chunks.

        Args:
            org_id: Organization ID to filter by.
            query: Search query.
            limit: Maximum number of results.

        Returns:
            List of matching chunks with scores.

        Raises:
            VectorStoreError: If search operation fails.
        """
        try:
            # Generate query embedding
            query_embedding = await self.embedding_service.embed_text(query)

            # Search with org_id filter
            results = await self.client.search(
                collection_name=self.COLLECTION_NAME,
                query_vector=query_embedding,
                query_filter=Filter(
                    must=[
                        FieldCondition(
                            key="org_id",
                            match=MatchValue(value=str(org_id)),
                        )
                    ]
                ),
                limit=limit,
            )

            return [
                {
                    "score": result.score,
                    "document_id": (
                        result.payload.get("document_id") if result.payload else None
                    ),
                    "chunk_index": (
                        result.payload.get("chunk_index") if result.payload else None
                    ),
                    "page_number": (
                        result.payload.get("page_number") if result.payload else None
                    ),
                    "section_title": (
                        result.payload.get("section_title") if result.payload else None
                    ),
                    "content": (
                        result.payload.get("content_raw") if result.payload else None
                    ),
                }
                for result in results
            ]
        except UnexpectedResponse as e:
            raise VectorStoreError(f"Failed to search: {e}") from e

    async def delete_document(self, org_id: UUID, document_id: UUID) -> None:
        """Delete all chunks for a document.

        Args:
            org_id: Organization ID.
            document_id: Document ID.

        Raises:
            VectorStoreError: If delete operation fails.
        """
        try:
            await self.client.delete(
                collection_name=self.COLLECTION_NAME,
                points_selector=Filter(
                    must=[
                        FieldCondition(
                            key="org_id",
                            match=MatchValue(value=str(org_id)),
                        ),
                        FieldCondition(
                            key="document_id",
                            match=MatchValue(value=str(document_id)),
                        ),
                    ]
                ),
            )
        except UnexpectedResponse as e:
            raise VectorStoreError(f"Failed to delete document: {e}") from e
