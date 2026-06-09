"""Shared retrieval interfaces used by HTTP and MCP integrations."""

from .retriever import (
    IndexMetadata,
    RetrievalResult,
    SourceMetadata,
    get_retriever,
)

__all__ = [
    "IndexMetadata",
    "RetrievalResult",
    "SourceMetadata",
    "get_retriever",
]

