"""Get document section tool for RAG agent."""

import logging
from typing import Any
from uuid import UUID

from langchain_core.tools import BaseTool
from pydantic import BaseModel, Field
from qdrant_client.models import FieldCondition, Filter, MatchText, MatchValue

from app.services.vector_store import VectorStoreService

logger = logging.getLogger(__name__)


class GetDocumentSectionInput(BaseModel):
    """Input schema for get document section tool."""

    section_title: str = Field(
        description=(
            "The section or chapter title to retrieve. "
            "Examples: 'Chapter 4.2', 'Maintenance Schedule', "
            "'Hydraulic System', 'Error Codes'."
        )
    )
    document_name: str | None = Field(
        default=None,
        description=(
            "Optional: specific document name to search in. "
            "Examples: 'CAT 320 Manual', 'Komatsu PC200'."
        ),
    )
    include_adjacent: bool = Field(
        default=True,
        description="Whether to include adjacent chunks for more context.",
    )


class GetDocumentSectionTool(BaseTool):
    """Tool for reading specific document sections.

    Use this tool to get content from a specific chapter,
    section, or named part of a document.
    """

    name: str = "get_document_section"
    description: str = (
        "Retrieve a specific section or chapter from documents. "
        "Use this when you need content from 'Chapter 4.2' or "
        "'Maintenance Schedule' or a specific named section. "
        "Returns the full section content."
    )
    args_schema: type[BaseModel] = GetDocumentSectionInput

    # Custom attributes
    org_id: UUID
    _vector_store: VectorStoreService | None = None

    def __init__(self, org_id: UUID, **kwargs: Any) -> None:
        """Initialize the get document section tool.

        Args:
            org_id: The organization ID to filter results by.
            **kwargs: Additional arguments passed to BaseTool.
        """
        super().__init__(org_id=org_id, **kwargs)
        self._vector_store = VectorStoreService()

    def _run(
        self,
        section_title: str,
        document_name: str | None = None,
        include_adjacent: bool = True,
    ) -> str:
        """Synchronous run is not supported - use async version."""
        raise NotImplementedError("Use async version of this tool")

    async def _arun(
        self,
        section_title: str,
        document_name: str | None = None,
        include_adjacent: bool = True,
    ) -> str:
        """Retrieve a specific document section.

        Args:
            section_title: The section title to find.
            document_name: Optional document name filter.
            include_adjacent: Whether to include adjacent chunks.

        Returns:
            Formatted section content as a string.
        """
        logger.info(
            "Get section for org=%s section='%s' document=%s",
            self.org_id,
            section_title[:50],
            document_name,
        )

        if self._vector_store is None:
            return "Error: Vector store not initialized"

        try:
            # Build filter conditions
            must_conditions = [
                FieldCondition(
                    key="org_id",
                    match=MatchValue(value=str(self.org_id)),
                ),
                FieldCondition(
                    key="section_title",
                    match=MatchText(text=section_title),
                ),
            ]

            scroll_filter = Filter(must=must_conditions)

            # Get matching chunks
            points, _ = await self._vector_store.client.scroll(
                collection_name=self._vector_store.COLLECTION_NAME,
                scroll_filter=scroll_filter,
                limit=20,  # Get more to filter and sort
                with_payload=True,
                with_vectors=False,
            )

            if not points:
                # Try semantic search as fallback
                results = await self._vector_store.search(
                    org_id=self.org_id,
                    query=f"section {section_title}",
                    limit=10,
                )

                # Filter by section title similarity
                section_lower = section_title.lower()
                filtered = [
                    r for r in results
                    if r.get("section_title")
                    and section_lower in r["section_title"].lower()
                ]

                if not filtered:
                    return (
                        f"Section '{section_title}' not found. "
                        "Try using semantic_search for related content."
                    )

                # Use filtered semantic results
                points_data = [
                    {
                        "content_raw": r.get("content", ""),
                        "section_title": r.get("section_title", ""),
                        "page_number": r.get("page_number"),
                        "chunk_index": r.get("chunk_index", 0),
                        "document_id": r.get("document_id", ""),
                    }
                    for r in filtered
                ]
            else:
                # Extract payload data from points
                points_data = []
                for point in points:
                    payload = point.payload or {}
                    # Filter by document name if specified
                    if document_name:
                        doc_id = payload.get("document_id", "")
                        # Simple check - in real implementation would lookup doc name
                        if document_name.lower() not in doc_id.lower():
                            continue

                    points_data.append({
                        "content_raw": payload.get("content_raw", ""),
                        "section_title": payload.get("section_title", ""),
                        "page_number": payload.get("page_number"),
                        "chunk_index": payload.get("chunk_index", 0),
                        "document_id": payload.get("document_id", ""),
                    })

            if not points_data:
                return (
                    f"Section '{section_title}' not found"
                    + (f" in document '{document_name}'." if document_name else ".")
                )

            # Sort by document_id and chunk_index to maintain order
            points_data.sort(
                key=lambda x: (x.get("document_id", ""), x.get("chunk_index", 0))
            )

            # Group by document
            sections_by_doc: dict[str, list[dict[str, Any]]] = {}
            for data in points_data:
                doc_id = data.get("document_id", "unknown")
                if doc_id not in sections_by_doc:
                    sections_by_doc[doc_id] = []
                sections_by_doc[doc_id].append(data)

            # Format output
            output_parts = []
            for doc_id, chunks in sections_by_doc.items():
                section_name = chunks[0].get("section_title", section_title)
                page = chunks[0].get("page_number")

                header = f"=== {section_name}"
                if page:
                    header += f" (Page {page})"
                header += " ==="
                output_parts.append(header)

                # Combine chunk contents
                combined_content = "\n\n".join(
                    chunk.get("content_raw", "") for chunk in chunks
                )
                output_parts.append(combined_content)

            return "\n\n".join(output_parts)

        except Exception as e:
            logger.exception("Get section failed: %s", e)
            return f"Error retrieving section: {e!s}"
