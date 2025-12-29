"""Keyword search tool for RAG agent."""

import logging
import re
from typing import Any
from uuid import UUID

from langchain_core.tools import BaseTool
from pydantic import BaseModel, Field
from qdrant_client.models import FieldCondition, Filter, MatchText

from app.services.vector_store import VectorStoreService

logger = logging.getLogger(__name__)


class KeywordSearchInput(BaseModel):
    """Input schema for keyword search tool."""

    keyword: str = Field(
        description=(
            "The exact keyword, error code, part number, or model number to search for. "
            "Examples: 'E-4021', 'CAT 320', '7C-3095', 'P0420'."
        )
    )
    fuzzy: bool = Field(
        default=True,
        description="Whether to allow fuzzy matching for typos.",
    )
    limit: int = Field(
        default=5,
        description="Maximum number of results to return (1-10).",
        ge=1,
        le=10,
    )


class KeywordSearchTool(BaseTool):
    """Tool for exact/fuzzy keyword search in documents.

    Use this tool to find specific codes, part numbers, model numbers,
    or exact terms. Better than semantic search for technical codes
    and identifiers.
    """

    name: str = "keyword_search"
    description: str = (
        "Search for exact keywords, error codes, part numbers, or model numbers. "
        "Use this for specific technical identifiers like 'E-4021', 'CAT 320', "
        "'7C-3095', or 'P0420'. Returns document chunks containing the exact "
        "or similar terms."
    )
    args_schema: type[BaseModel] = KeywordSearchInput

    # Custom attributes
    org_id: UUID
    _vector_store: VectorStoreService | None = None

    def __init__(self, org_id: UUID, **kwargs: Any) -> None:
        """Initialize the keyword search tool.

        Args:
            org_id: The organization ID to filter results by.
            **kwargs: Additional arguments passed to BaseTool.
        """
        super().__init__(org_id=org_id, **kwargs)
        self._vector_store = VectorStoreService()

    def _run(self, keyword: str, fuzzy: bool = True, limit: int = 5) -> str:
        """Synchronous run is not supported - use async version."""
        raise NotImplementedError("Use async version of this tool")

    async def _arun(self, keyword: str, fuzzy: bool = True, limit: int = 5) -> str:
        """Search documents for specific keywords.

        Args:
            keyword: The keyword to search for.
            fuzzy: Whether to use fuzzy matching.
            limit: Maximum number of results.

        Returns:
            Formatted search results as a string.
        """
        logger.info(
            "Keyword search for org=%s keyword='%s' fuzzy=%s limit=%d",
            self.org_id,
            keyword,
            fuzzy,
            limit,
        )

        if self._vector_store is None:
            return "Error: Vector store not initialized"

        try:
            # Use Qdrant's scroll with filter for keyword matching
            # We search in content_raw field using text matching
            scroll_filter = Filter(
                must=[
                    FieldCondition(
                        key="org_id",
                        match=MatchText(text=str(self.org_id)),
                    ),
                    FieldCondition(
                        key="content_raw",
                        match=MatchText(text=keyword),
                    ),
                ]
            )

            # Scroll through matching points
            points, _ = await self._vector_store.client.scroll(
                collection_name=self._vector_store.COLLECTION_NAME,
                scroll_filter=scroll_filter,
                limit=limit,
                with_payload=True,
                with_vectors=False,
            )

            if not points:
                # If exact match fails, try case-insensitive regex search
                # in the already retrieved semantic results
                results = await self._vector_store.search(
                    org_id=self.org_id,
                    query=keyword,
                    limit=limit * 2,  # Get more results to filter
                )

                # Filter results containing the keyword (case-insensitive)
                keyword_pattern = re.compile(re.escape(keyword), re.IGNORECASE)
                filtered_results = [
                    r for r in results
                    if r.get("content") and keyword_pattern.search(r["content"])
                ]

                if not filtered_results:
                    return f"No documents found containing '{keyword}'."

                # Format filtered results
                output_parts = []
                for i, result in enumerate(filtered_results[:limit], 1):
                    content = result.get("content", "")
                    section = result.get("section_title", "")
                    page = result.get("page_number")

                    source_info = []
                    if section:
                        source_info.append(f"Section: {section}")
                    if page:
                        source_info.append(f"Page: {page}")

                    source_str = (
                        ", ".join(source_info) if source_info else "Unknown source"
                    )
                    # Highlight the keyword in content
                    highlighted = keyword_pattern.sub(
                        f"**{keyword}**", content[:500]
                    )
                    output_parts.append(f"[Result {i}] ({source_str})\n{highlighted}")

                return "\n\n".join(output_parts)

            # Format Qdrant scroll results
            output_parts = []
            for i, point in enumerate(points, 1):
                payload = point.payload or {}
                content = payload.get("content_raw", "")
                section = payload.get("section_title", "")
                page = payload.get("page_number")

                source_info = []
                if section:
                    source_info.append(f"Section: {section}")
                if page:
                    source_info.append(f"Page: {page}")

                source_str = ", ".join(source_info) if source_info else "Unknown source"
                output_parts.append(f"[Result {i}] ({source_str})\n{content[:500]}")

            return "\n\n".join(output_parts)

        except Exception as e:
            logger.exception("Keyword search failed: %s", e)
            return f"Search error: {e!s}"
