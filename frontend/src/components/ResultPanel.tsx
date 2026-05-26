import type { RagPlaceResult } from '../types/rag'

type ResultPanelProps = {
  result: RagPlaceResult | null
  results: RagPlaceResult[]
  loading: boolean
  error: string | null
  onSelectResult: (result: RagPlaceResult) => void
}

function ResultPanel({
  result,
  results,
  loading,
  error,
  onSelectResult,
}: ResultPanelProps) {
  if (loading) {
    return (
      <aside className="detail-panel result-state" aria-label="Search result">
        <strong>Searching places...</strong>
        <p>Retrieving map-aware context and sources for your query.</p>
      </aside>
    )
  }

  if (error) {
    return (
      <aside className="detail-panel result-state" aria-label="Search result">
        <strong>Search failed</strong>
        <p>{error}</p>
      </aside>
    )
  }

  if (!result) {
    return (
      <aside className="detail-panel result-state" aria-label="Search result">
        <strong>Search the city</strong>
        <p>Ask for a place, neighborhood, route idea, or architectural detail.</p>
      </aside>
    )
  }

  return (
    <aside className="detail-panel" aria-label="Search result">
      {results.length > 1 ? (
        <div className="result-list" aria-label="Search results">
          {results.map((item) => (
            <button
              className={item.id === result.id ? 'selected' : ''}
              key={item.id}
              onClick={() => onSelectResult(item)}
              type="button"
            >
              <strong>{item.name}</strong>
              <span>{item.category}</span>
            </button>
          ))}
        </div>
      ) : null}

      <div className="place-title">
        <h1>{result.name}</h1>
        <span>{result.category}</span>
      </div>

      {result.address ? <p className="address">{result.address}</p> : null}

      {result.facts?.length ? (
        <div className="facts">
          {result.facts.map((fact) => (
            <div key={fact.label}>
              <span>{fact.label}</span>
              <strong>{fact.value}</strong>
            </div>
          ))}
        </div>
      ) : null}

      <section className="copy-block">
        <h2>RAG Summary</h2>
        <p>{result.summary}</p>
        {result.whyVisit ? <p>{result.whyVisit}</p> : null}

        {result.tags?.length ? (
          <div className="tags">
            {result.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        ) : null}
      </section>

      <section className="insight">
        <h2>Sources</h2>
        <div className="source-list">
          {result.sources.map((source) => (
            <article key={`${source.title}-${source.url ?? source.snippet}`}>
              {source.url ? (
                <a href={source.url} rel="noreferrer" target="_blank">
                  {source.title}
                </a>
              ) : (
                <strong>{source.title}</strong>
              )}
              <p>{source.snippet}</p>
            </article>
          ))}
        </div>
      </section>
    </aside>
  )
}

export default ResultPanel
