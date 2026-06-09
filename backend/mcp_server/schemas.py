from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


class SearchResult(BaseModel):
    title: str
    summary: str
    source: str
    score: float | None
    metadata: dict[str, Any]


class SearchLocationContextOutput(BaseModel):
    query: str
    results: list[SearchResult]


class Evidence(BaseModel):
    claim: str
    source: str


class AnalyzeLocationOutput(BaseModel):
    location: str
    criteria: list[str]
    summary: str
    strengths: list[str]
    weaknesses: list[str]
    evidence: list[Evidence]
    confidence: Literal["low", "medium", "high"]


class LocationComparison(BaseModel):
    location: str
    pros: list[str]
    cons: list[str]
    best_for: list[str]
    evidence_sources: list[str]


class CompareLocationsOutput(BaseModel):
    locations: list[str]
    criteria: list[str]
    comparison: list[LocationComparison]
    recommendation: str
    confidence: Literal["low", "medium", "high"]


class SupportingEvidence(BaseModel):
    finding: str
    source: str


class GenerateLocationReportOutput(BaseModel):
    title: str
    executive_summary: str
    key_findings: list[str]
    supporting_evidence: list[SupportingEvidence]
    risks_or_limitations: list[str]
    next_questions: list[str]


class AvailableSource(BaseModel):
    name: str
    type: Literal["document", "dataset", "webpage", "unknown"]
    description: str
    path_or_id: str


class ListAvailableSourcesOutput(BaseModel):
    sources: list[AvailableSource]


class LocationIndexMetadataOutput(BaseModel):
    backend: str
    data_directory: str
    source_count: int = Field(ge=0)
    document_count: int | None = Field(default=None, ge=0)
    chunk_count: int | None = Field(default=None, ge=0)
    status: str

