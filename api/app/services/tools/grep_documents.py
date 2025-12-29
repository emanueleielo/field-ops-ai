"""Grep documents tool for RAG agent."""

import logging
import re
from typing import Any
from uuid import UUID

from langchain_core.tools import BaseTool
from pydantic import BaseModel, Field
from qdrant_client.models import FieldCondition, Filter, MatchValue

from app.services.vector_store import VectorStoreService

logger = logging.getLogger(__name__)


class GrepDocumentsInput(BaseModel):
    """Input schema for grep documents tool."""

    pattern: str = Field(
        description=(
            "A regular expression pattern to search for in documents. "
            "Use standard regex syntax. Examples: "
            "'\\d{3}-\\d{4}' for part numbers, "
            "'ERROR.*\\d+' for error messages with codes, "
            "'torque.*N[.\\s]?m' for torque specifications."
        )
    )
    case_insensitive: bool = Field(
        default=True,
        description="Whether to ignore case when matching.",
    )
    limit: int = Field(
        default=5,
        description="Maximum number of results to return (1-10).",
        ge=1,
        le=10,
    )


class GrepDocumentsTool(BaseTool):
    """Tool for regex pattern search in raw documents.

    Use this tool to find specific patterns like serial numbers,
    measurements, specifications, or structured data using
    regular expressions.
    """

    name: str = "grep_documents"
    description: str = (
        "Search documents using regular expressions (regex). Use this for "
        "pattern matching like serial numbers ('\\d{3}-\\d{4}'), "
        "measurements ('\\d+\\s*(mm|cm|m|kg|lb)'), "
        "or structured codes. Returns matching text with context."
    )
    args_schema: type[BaseModel] = GrepDocumentsInput

    # Custom attributes
    org_id: UUID
    _vector_store: VectorStoreService | None = None

    def __init__(self, org_id: UUID, **kwargs: Any) -> None:
        """Initialize the grep documents tool.

        Args:
            org_id: The organization ID to filter results by.
            **kwargs: Additional arguments passed to BaseTool.
        """
        super().__init__(org_id=org_id, **kwargs)
        self._vector_store = VectorStoreService()

    def _run(
        self, pattern: str, case_insensitive: bool = True, limit: int = 5
    ) -> str:
        """Synchronous run is not supported - use async version."""
        raise NotImplementedError("Use async version of this tool")

    async def _arun(
        self, pattern: str, case_insensitive: bool = True, limit: int = 5
    ) -> str:
        """Search documents using regex pattern.

        Args:
            pattern: The regex pattern to search for.
            case_insensitive: Whether to ignore case.
            limit: Maximum number of results.

        Returns:
            Formatted search results as a string.
        """
        logger.info(
            "Grep search for org=%s pattern='%s' case_insensitive=%s limit=%d",
            self.org_id,
            pattern[:50],
            case_insensitive,
            limit,
        )

        if self._vector_store is None:
            return "Error: Vector store not initialized"

        try:
            # Validate regex pattern
            flags = re.IGNORECASE if case_insensitive else 0
            try:
                compiled_pattern = re.compile(pattern, flags)
            except re.error as e:
                return f"Invalid regex pattern: {e!s}"

            # Get all chunks for this organization
            # We'll use scroll to get chunks and filter by regex
            scroll_filter = Filter(
                must=[
                    FieldCondition(
                        key="org_id",
                        match=MatchValue(value=str(self.org_id)),
                    )
                ]
            )

            # Scroll through chunks in batches
            all_matches: list[dict[str, Any]] = []
            offset = None
            batch_size = 100

            while len(all_matches) < limit:
                points, offset = await self._vector_store.client.scroll(
                    collection_name=self._vector_store.COLLECTION_NAME,
                    scroll_filter=scroll_filter,
                    limit=batch_size,
                    offset=offset,
                    with_payload=True,
                    with_vectors=False,
                )

                if not points:
                    break

                for point in points:
                    payload = point.payload or {}
                    content = payload.get("content_raw", "")

                    # Search for pattern matches
                    matches = list(compiled_pattern.finditer(content))
                    if matches:
                        # Extract context around first match
                        first_match = matches[0]
                        start = max(0, first_match.start() - 100)
                        end = min(len(content), first_match.end() + 100)
                        context = content[start:end]

                        # Highlight all matches in context
                        highlighted = compiled_pattern.sub(
                            lambda m: f"**{m.group()}**",
                            context,
                        )

                        all_matches.append({
                            "content": highlighted,
                            "section_title": payload.get("section_title", ""),
                            "page_number": payload.get("page_number"),
                            "match_count": len(matches),
                        })

                        if len(all_matches) >= limit:
                            break

                if offset is None:
                    break

            if not all_matches:
                return f"No documents matched the pattern '{pattern}'."

            # Format results
            output_parts = []
            for i, match in enumerate(all_matches, 1):
                section = match.get("section_title", "")
                page = match.get("page_number")
                match_count = match.get("match_count", 1)

                source_info = []
                if section:
                    source_info.append(f"Section: {section}")
                if page:
                    source_info.append(f"Page: {page}")
                source_info.append(f"{match_count} match(es)")

                source_str = ", ".join(source_info)
                output_parts.append(
                    f"[Result {i}] ({source_str})\n...{match['content']}..."
                )

            return "\n\n".join(output_parts)

        except Exception as e:
            logger.exception("Grep search failed: %s", e)
            return f"Search error: {e!s}"
