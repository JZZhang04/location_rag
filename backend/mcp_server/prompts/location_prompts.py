from mcp.server.fastmcp import FastMCP


def register_prompts(mcp: FastMCP) -> None:
    @mcp.prompt(title="Location Analysis")
    def location_analysis_prompt(location: str = "") -> str:
        """Guide an assistant through a source-grounded location analysis."""
        target = location.strip() or "the location provided by the user"
        return f"""\
Analyze {target} using the location_rag MCP server.

1. Call search_location_context first to discover relevant evidence.
2. When a specific location is available, call analyze_location with the
   user's criteria.
3. Cite or name the retrieved sources for factual findings.
4. Clearly separate evidence-backed findings from assumptions or general advice.
5. State confidence and data limitations.
6. Ask a follow-up question only when a missing requirement prevents a useful
   analysis. Do not invent facts absent from the retrieved context.
"""

    @mcp.prompt(title="Location Comparison")
    def location_comparison_prompt() -> str:
        """Guide an assistant through a grounded comparison of locations."""
        return """\
Compare the locations using the location_rag MCP server.

1. Call compare_locations with every location and the user's stated criteria.
2. Compare only the evidence returned by the tool.
3. Give a concise recommendation tied to the requested criteria.
4. Name evidence sources and mention confidence and data limitations.
5. Do not fill evidence gaps with unsupported claims.
"""

