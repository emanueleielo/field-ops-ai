"""Semantic search tool for RAG agent."""

import logging
from typing import Any
from uuid import UUID

from langchain_core.tools import BaseTool
from pydantic import BaseModel, Field

from app.services.vector_store import VectorStoreService

logger = logging.getLogger(__name__)


class SemanticSearchInput(BaseModel):
    """Input schema for semantic search tool."""

    query: str = Field(
        description=(
            "The natural language query to search for. "
            "Use this for conceptual questions like 'how to replace oil filter' "
            "or 'maintenance procedures for hydraulic system'."
        )
    )
    limit: int = Field(
        default=5,
        description="Maximum number of results to return (1-10).",
        ge=1,
        le=10,
    )


class SemanticSearchTool(BaseTool):
    """Tool for semantic similarity search in document vectors.

    Use this tool to find relevant document sections by meaning.
    Best for natural language questions about procedures, concepts,
    or general information.
    """

    name: str = "semantic_search"
    description: str = (
        "Search documents by semantic meaning. Use this for natural language "
        "questions about procedures, concepts, maintenance, troubleshooting, "
        "or general technical information. Returns relevant document chunks "
        "with content and source information."
    )
    args_schema: type[BaseModel] = SemanticSearchInput

    # Custom attributes
    org_id: UUID
    _vector_store: VectorStoreService | None = None

    def __init__(self, org_id: UUID, **kwargs: Any) -> None:
        """Initialize the semantic search tool.

        Args:
            org_id: The organization ID to filter results by.
            **kwargs: Additional arguments passed to BaseTool.
        """
        super().__init__(org_id=org_id, **kwargs)
        self._vector_store = VectorStoreService()

    def _run(self, query: str, limit: int = 5) -> str:
        """Synchronous run is not supported - use async version."""
        raise NotImplementedError("Use async version of this tool")

    async def _arun(self, query: str, limit: int = 5) -> str:
        """Search documents by semantic similarity.

        Args:
            query: The search query.
            limit: Maximum number of results.

        Returns:
            Formatted search results as a string.
        """
        logger.info(
            "Semantic search for org=%s query='%s' limit=%d",
            self.org_id,
            query[:50],
            limit,
        )

        if self._vector_store is None:
            return "Error: Vector store not initialized"

        try:
            results = await self._vector_store.search(
                org_id=self.org_id,
                query=query,
                limit=limit,
            )

            if not results:
                return "No relevant documents found for this query."

            # Format results for LLM consumption
            output_parts = []
            for i, result in enumerate(results, 1):
                score = result.get("score", 0)
                content = result.get("content", "")
                section = result.get("section_title", "")
                page = result.get("page_number")

                source_info = []
                if section:
                    source_info.append(f"Section: {section}")
                if page:
                    source_info.append(f"Page: {page}")

                source_str = ", ".join(source_info) if source_info else "Unknown source"
                output_parts.append(
                    f"[Result {i}] (Score: {score:.2f}, {source_str})\n{content}"
                )

            return "\n\n".join(output_parts)

        except Exception as e:
            logger.exception("Semantic search failed: %s", e)
            return f"Search error: {e!s}"
