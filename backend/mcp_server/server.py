from __future__ import annotations

import logging

from mcp.server.fastmcp import FastMCP

from .prompts import register_prompts
from .resources import register_resources
from .service import LocationRagService
from .tools import register_tools


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)

mcp = FastMCP(
    name="location_rag",
    instructions=(
        "Read-only location intelligence tools backed by the project's shared "
        "RAG retriever. Treat returned sources as evidence and disclose gaps."
    ),
)
service = LocationRagService()

register_tools(mcp, service)
register_resources(mcp, service)
register_prompts(mcp)


def main() -> None:
    """Run the local MCP server over stdio."""
    mcp.run()


if __name__ == "__main__":
    main()

