from __future__ import annotations

import logging
from typing import Annotated

from mcp.server.fastmcp import FastMCP
from pydantic import Field

from ..schemas import (
    AnalyzeLocationOutput,
    CompareLocationsOutput,
    GenerateLocationReportOutput,
    ListAvailableSourcesOutput,
    SearchLocationContextOutput,
)
from ..service import LocationRagService


logger = logging.getLogger(__name__)


def register_tools(mcp: FastMCP, service: LocationRagService) -> None:
    @mcp.tool()
    def search_location_context(
        query: Annotated[str, Field(min_length=1, max_length=500)],
        top_k: Annotated[int, Field(ge=1, le=10)] = 5,
    ) -> SearchLocationContextOutput:
        """Search the location RAG knowledge base and return attributed evidence."""
        logger.info("tool=search_location_context top_k=%s", top_k)
        return service.search(query, top_k)

    @mcp.tool()
    def analyze_location(
        location: Annotated[str, Field(min_length=1, max_length=500)],
        criteria: Annotated[list[str], Field(min_length=1, max_length=10)],
    ) -> AnalyzeLocationOutput:
        """Retrieve and structure grounded evidence for one location."""
        logger.info("tool=analyze_location criteria_count=%s", len(criteria))
        return service.analyze(location, criteria)

    @mcp.tool()
    def compare_locations(
        locations: Annotated[list[str], Field(min_length=2, max_length=5)],
        criteria: Annotated[list[str], Field(min_length=1, max_length=10)],
    ) -> CompareLocationsOutput:
        """Compare locations using only evidence available to the RAG retriever."""
        logger.info(
            "tool=compare_locations locations_count=%s criteria_count=%s",
            len(locations),
            len(criteria),
        )
        return service.compare(locations, criteria)

    @mcp.tool()
    def generate_location_report(
        location: Annotated[str, Field(min_length=1, max_length=500)],
        report_type: Annotated[str, Field(min_length=1, max_length=100)],
    ) -> GenerateLocationReportOutput:
        """Generate an evidence-backed, structured location report."""
        logger.info("tool=generate_location_report")
        return service.report(location, report_type)

    @mcp.tool()
    def list_available_sources() -> ListAvailableSourcesOutput:
        """List documents and datasets currently available to the retriever."""
        logger.info("tool=list_available_sources")
        return service.sources()

