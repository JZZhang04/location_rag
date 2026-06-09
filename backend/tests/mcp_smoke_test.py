from __future__ import annotations

import sys
from pathlib import Path

import anyio
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client


BACKEND_DIR = Path(__file__).resolve().parents[1]
SERVER_COMMAND = BACKEND_DIR / "venv" / "bin" / "location-rag-mcp"


async def run_smoke_test() -> None:
    parameters = StdioServerParameters(command=str(SERVER_COMMAND), args=[])

    async with stdio_client(parameters) as streams:
        async with ClientSession(*streams) as session:
            await session.initialize()

            tools = await session.list_tools()
            resources = await session.list_resources()
            prompts = await session.list_prompts()

            expected_tools = {
                "search_location_context",
                "analyze_location",
                "compare_locations",
                "generate_location_report",
                "list_available_sources",
            }
            assert {tool.name for tool in tools.tools} == expected_tools
            assert len(resources.resources) == 3
            assert len(prompts.prompts) == 2

            calls = [
                ("list_available_sources", {}),
                (
                    "search_location_context",
                    {"query": "Boston transit", "top_k": 5},
                ),
                (
                    "analyze_location",
                    {"location": "Back Bay", "criteria": ["transit", "walkability"]},
                ),
                (
                    "compare_locations",
                    {
                        "locations": ["Back Bay", "Cambridge"],
                        "criteria": ["transit"],
                    },
                ),
                (
                    "generate_location_report",
                    {"location": "Back Bay", "report_type": "neighborhood"},
                ),
            ]

            for tool_name, arguments in calls:
                result = await session.call_tool(tool_name, arguments)
                assert not result.isError, f"{tool_name} failed: {result.content}"

    print("MCP smoke test passed: 5 tools, 3 resources, and 2 prompts.")


if __name__ == "__main__":
    if not SERVER_COMMAND.exists():
        sys.exit("Install the backend first with: backend/venv/bin/pip install -e backend")
    anyio.run(run_smoke_test)

