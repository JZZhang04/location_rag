from __future__ import annotations

from app.rag.retriever import LocationRetriever, RetrievalResult, get_retriever

from .schemas import (
    AnalyzeLocationOutput,
    AvailableSource,
    CompareLocationsOutput,
    Evidence,
    GenerateLocationReportOutput,
    ListAvailableSourcesOutput,
    LocationComparison,
    LocationIndexMetadataOutput,
    SearchLocationContextOutput,
    SearchResult,
    SupportingEvidence,
)


class LocationRagService:
    def __init__(self, retriever: LocationRetriever | None = None) -> None:
        self.retriever = retriever or get_retriever()

    def search(self, query: str, top_k: int = 5) -> SearchLocationContextOutput:
        clean_query = _required_text(query, "query")
        if not 1 <= top_k <= 10:
            raise ValueError("top_k must be between 1 and 10")

        results = self.retriever.search(clean_query, top_k)
        return SearchLocationContextOutput(
            query=clean_query,
            results=[_search_result(result) for result in results],
        )

    def analyze(self, location: str, criteria: list[str]) -> AnalyzeLocationOutput:
        clean_location = _required_text(location, "location")
        clean_criteria = _clean_list(criteria, "criteria")
        query = f"{clean_location} {' '.join(clean_criteria)}"
        results = self.retriever.search(query, 8)
        evidence = [
            Evidence(claim=result.summary, source=result.source)
            for result in results[:5]
            if result.summary
        ]

        if not evidence:
            return AnalyzeLocationOutput(
                location=clean_location,
                criteria=clean_criteria,
                summary="No indexed evidence was found for this location and criteria.",
                strengths=[],
                weaknesses=[
                    "The current knowledge base does not contain enough evidence for an analysis."
                ],
                evidence=[],
                confidence="low",
            )

        return AnalyzeLocationOutput(
            location=clean_location,
            criteria=clean_criteria,
            summary=(
                f"Retrieved {len(evidence)} evidence excerpt(s) about {clean_location}. "
                "The excerpts below are source-grounded; qualitative interpretation "
                "should be performed by the calling assistant."
            ),
            strengths=[
                f"Indexed evidence is available for {', '.join(clean_criteria)}."
            ],
            weaknesses=[
                "The retriever does not independently verify freshness or completeness."
            ],
            evidence=evidence,
            confidence=_confidence(len(evidence)),
        )

    def compare(
        self,
        locations: list[str],
        criteria: list[str],
    ) -> CompareLocationsOutput:
        clean_locations = _clean_list(locations, "locations")
        if len(clean_locations) < 2 or len(clean_locations) > 5:
            raise ValueError("locations must contain between 2 and 5 values")
        clean_criteria = _clean_list(criteria, "criteria")

        comparisons: list[LocationComparison] = []
        evidence_counts: list[int] = []
        for location in clean_locations:
            results = self.retriever.search(
                f"{location} {' '.join(clean_criteria)}",
                5,
            )
            evidence_counts.append(len(results))
            comparisons.append(
                LocationComparison(
                    location=location,
                    pros=(
                        [f"Retrieved {len(results)} relevant evidence source(s)."]
                        if results
                        else []
                    ),
                    cons=(
                        ["No indexed evidence was found for this location."]
                        if not results
                        else ["Evidence coverage may be incomplete or uneven."]
                    ),
                    best_for=[],
                    evidence_sources=list(dict.fromkeys(item.source for item in results)),
                )
            )

        best_evidence = max(evidence_counts, default=0)
        if best_evidence == 0:
            recommendation = (
                "No recommendation can be made because the current index contains "
                "no matching evidence."
            )
        elif len(set(evidence_counts)) == 1:
            recommendation = (
                "Evidence coverage is tied. Review the cited sources before choosing."
            )
        else:
            leader = clean_locations[evidence_counts.index(best_evidence)]
            recommendation = (
                f"{leader} has the strongest evidence coverage in the current index, "
                "but coverage alone is not a quality ranking."
            )

        return CompareLocationsOutput(
            locations=clean_locations,
            criteria=clean_criteria,
            comparison=comparisons,
            recommendation=recommendation,
            confidence=_confidence(min(evidence_counts, default=0)),
        )

    def report(
        self,
        location: str,
        report_type: str,
    ) -> GenerateLocationReportOutput:
        clean_location = _required_text(location, "location")
        clean_report_type = _required_text(report_type, "report_type")
        results = self.retriever.search(
            f"{clean_location} {clean_report_type}",
            10,
        )
        evidence = [
            SupportingEvidence(finding=item.summary, source=item.source)
            for item in results[:6]
            if item.summary
        ]
        findings = [item.finding for item in evidence]

        return GenerateLocationReportOutput(
            title=f"{clean_location}: {clean_report_type.title()} Report",
            executive_summary=(
                f"This report contains {len(evidence)} retrieved evidence excerpt(s)."
                if evidence
                else "No indexed evidence was found, so a grounded report could not be generated."
            ),
            key_findings=findings,
            supporting_evidence=evidence,
            risks_or_limitations=[
                "Results are limited to the sources currently available in the location RAG index.",
                "Source freshness and geographic coverage are not independently verified.",
            ],
            next_questions=[
                f"What additional data is needed to evaluate {clean_location}?",
                f"Which {clean_report_type} criteria matter most to the user?",
            ],
        )

    def sources(self) -> ListAvailableSourcesOutput:
        return ListAvailableSourcesOutput(
            sources=[
                AvailableSource(
                    name=source.name,
                    type=source.type,  # type: ignore[arg-type]
                    description=source.description,
                    path_or_id=source.path_or_id,
                )
                for source in self.retriever.list_sources()
            ]
        )

    def index_metadata(self) -> LocationIndexMetadataOutput:
        metadata = self.retriever.index_metadata()
        return LocationIndexMetadataOutput(
            backend=metadata.backend,
            data_directory=metadata.data_directory,
            source_count=metadata.source_count,
            document_count=metadata.document_count,
            chunk_count=metadata.chunk_count,
            status=metadata.status,
        )


def _search_result(result: RetrievalResult) -> SearchResult:
    return SearchResult(
        title=result.title,
        summary=result.summary,
        source=result.source,
        score=result.score,
        metadata=result.metadata,
    )


def _required_text(value: str, field_name: str) -> str:
    clean_value = value.strip()
    if not clean_value:
        raise ValueError(f"{field_name} must not be empty")
    if len(clean_value) > 500:
        raise ValueError(f"{field_name} must be 500 characters or fewer")
    return clean_value


def _clean_list(values: list[str], field_name: str) -> list[str]:
    cleaned = list(dict.fromkeys(value.strip() for value in values if value.strip()))
    if not cleaned:
        raise ValueError(f"{field_name} must contain at least one non-empty value")
    if len(cleaned) > 10:
        raise ValueError(f"{field_name} must contain at most 10 values")
    return cleaned


def _confidence(evidence_count: int) -> str:
    if evidence_count >= 5:
        return "high"
    if evidence_count >= 2:
        return "medium"
    return "low"

