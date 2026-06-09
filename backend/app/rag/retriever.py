from __future__ import annotations

import csv
import json
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Protocol


PROJECT_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_DATA_DIR = PROJECT_ROOT / "data"
SUPPORTED_SUFFIXES = {".csv", ".json", ".md", ".txt"}


@dataclass(frozen=True)
class RetrievalResult:
    title: str
    summary: str
    source: str
    score: float | None = None
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class SourceMetadata:
    name: str
    type: str
    description: str
    path_or_id: str


@dataclass(frozen=True)
class IndexMetadata:
    backend: str
    data_directory: str
    source_count: int
    document_count: int | None
    chunk_count: int | None
    status: str


class LocationRetriever(Protocol):
    def search(self, query: str, top_k: int = 5) -> list[RetrievalResult]:
        """Return grounded retrieval results for a natural-language query."""

    def list_sources(self) -> list[SourceMetadata]:
        """Return metadata for available indexed or source documents."""

    def index_metadata(self) -> IndexMetadata:
        """Return high-level metadata about the retrieval index."""


class FileSystemRetriever:
    """Evidence-only fallback until the project's vector retriever is added.

    This adapter performs simple lexical ranking over supported files in data/.
    Replace get_retriever() with the project's vector retriever once available;
    MCP and FastAPI callers can keep the same interface.
    """

    def __init__(self, data_dir: Path = DEFAULT_DATA_DIR) -> None:
        self.data_dir = data_dir.resolve()

    def search(self, query: str, top_k: int = 5) -> list[RetrievalResult]:
        terms = _tokenize(query)
        if not terms:
            return []

        matches: list[RetrievalResult] = []
        for path in self._source_files():
            text = _read_text(path)
            if not text:
                continue

            normalized = text.lower()
            hit_count = sum(normalized.count(term) for term in terms)
            if hit_count == 0:
                continue

            score = hit_count / max(len(terms), 1)
            matches.append(
                RetrievalResult(
                    title=path.stem.replace("_", " ").replace("-", " ").title(),
                    summary=_best_excerpt(text, terms),
                    source=_source_id(path),
                    score=round(score, 4),
                    metadata={
                        "file_type": path.suffix.lstrip(".").lower(),
                        "retrieval_backend": "filesystem-lexical-fallback",
                    },
                )
            )

        return sorted(
            matches,
            key=lambda item: item.score if item.score is not None else 0,
            reverse=True,
        )[:top_k]

    def list_sources(self) -> list[SourceMetadata]:
        return [
            SourceMetadata(
                name=path.name,
                type=_source_type(path),
                description=f"Local {path.suffix.lstrip('.').upper()} source file.",
                path_or_id=_source_id(path),
            )
            for path in self._source_files()
        ]

    def index_metadata(self) -> IndexMetadata:
        sources = self._source_files()
        return IndexMetadata(
            backend="filesystem-lexical-fallback",
            data_directory=str(self.data_dir),
            source_count=len(sources),
            document_count=len(sources),
            chunk_count=None,
            status="ready" if sources else "empty",
        )

    def _source_files(self) -> list[Path]:
        if not self.data_dir.exists():
            return []
        return sorted(
            path
            for path in self.data_dir.rglob("*")
            if path.is_file()
            and path.suffix.lower() in SUPPORTED_SUFFIXES
            and not path.name.startswith(".")
        )


def get_retriever() -> LocationRetriever:
    """Return the shared retriever used by integration layers."""

    return FileSystemRetriever()


def _tokenize(value: str) -> list[str]:
    return [token for token in re.findall(r"[a-z0-9]+", value.lower()) if len(token) > 1]


def _best_excerpt(text: str, terms: list[str], limit: int = 420) -> str:
    compact = re.sub(r"\s+", " ", text).strip()
    if not compact:
        return ""

    positions = [compact.lower().find(term) for term in terms]
    positions = [position for position in positions if position >= 0]
    start = max(min(positions, default=0) - 100, 0)
    excerpt = compact[start : start + limit]
    if start > 0:
        excerpt = f"...{excerpt}"
    if start + limit < len(compact):
        excerpt = f"{excerpt}..."
    return excerpt


def _read_text(path: Path) -> str:
    try:
        if path.suffix.lower() == ".json":
            return json.dumps(json.loads(path.read_text(encoding="utf-8")), ensure_ascii=True)
        if path.suffix.lower() == ".csv":
            with path.open(encoding="utf-8", newline="") as handle:
                return "\n".join(
                    " | ".join(f"{key}: {value}" for key, value in row.items())
                    for row in csv.DictReader(handle)
                )
        return path.read_text(encoding="utf-8")
    except (OSError, UnicodeError, json.JSONDecodeError):
        return ""


def _source_type(path: Path) -> str:
    if path.suffix.lower() in {".csv", ".json"}:
        return "dataset"
    if path.suffix.lower() in {".md", ".txt"}:
        return "document"
    return "unknown"


def _source_id(path: Path) -> str:
    try:
        return str(path.relative_to(PROJECT_ROOT))
    except ValueError:
        return str(path)
