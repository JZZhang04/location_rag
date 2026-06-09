from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from app.rag.retriever import FileSystemRetriever
from mcp_server.service import LocationRagService


class LocationRagServiceTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        data_dir = Path(self.temp_dir.name)
        (data_dir / "back_bay.md").write_text(
            "Back Bay has nearby transit stations and walkable blocks. "
            "The source describes architecture and public amenities.",
            encoding="utf-8",
        )
        self.service = LocationRagService(FileSystemRetriever(data_dir))

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def test_search_location_context(self) -> None:
        output = self.service.search("Back Bay transit", top_k=3)

        self.assertEqual(output.query, "Back Bay transit")
        self.assertEqual(len(output.results), 1)
        self.assertEqual(output.results[0].title, "Back Bay")
        self.assertIn("back_bay.md", output.results[0].source)

    def test_search_rejects_invalid_top_k(self) -> None:
        with self.assertRaisesRegex(ValueError, "top_k"):
            self.service.search("Boston", top_k=11)

    def test_analyze_empty_evidence_is_explicit(self) -> None:
        output = self.service.analyze("Unknown Place", ["safety"])

        self.assertEqual(output.confidence, "low")
        self.assertEqual(output.evidence, [])
        self.assertIn("No indexed evidence", output.summary)

    def test_compare_requires_multiple_locations(self) -> None:
        with self.assertRaisesRegex(ValueError, "between 2 and 5"):
            self.service.compare(["Boston"], ["transit"])

    def test_list_sources_uses_data_directory(self) -> None:
        output = self.service.sources()

        self.assertEqual(len(output.sources), 1)
        self.assertEqual(output.sources[0].type, "document")


if __name__ == "__main__":
    unittest.main()

