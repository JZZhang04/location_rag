from mcp.server.fastmcp import FastMCP

from ..service import LocationRagService


PROJECT_OVERVIEW = """\
location_rag is a location-intelligence application with a React/Mapbox client
and a Python FastAPI backend. The MCP server is a read-only integration layer.
It calls the same LocationRetriever interface intended for the HTTP API and
returns structured, source-attributed evidence to MCP-compatible assistants.
"""


def register_resources(mcp: FastMCP, service: LocationRagService) -> None:
    @mcp.resource("sources://all", mime_type="application/json")
    def all_sources() -> str:
        """Return all sources currently visible to the RAG retriever."""
        return service.sources().model_dump_json(indent=2)

    @mcp.resource("dataset://location-index", mime_type="application/json")
    def location_index() -> str:
        """Return metadata about the active location retrieval index."""
        return service.index_metadata().model_dump_json(indent=2)

    @mcp.resource("docs://project-overview", mime_type="text/plain")
    def project_overview() -> str:
        """Explain the project and how MCP connects to its RAG layer."""
        return PROJECT_OVERVIEW
