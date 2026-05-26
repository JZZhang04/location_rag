import type { RagPlaceResult } from '../types/rag'

const RAG_SEARCH_ENDPOINT = '/api/rag/search'

function buildMockResults(query: string): RagPlaceResult[] {
  return [
    {
      id: 'trinity-church',
      name: 'Trinity Church',
      category: 'Architectural Gem',
      address: '206 Clarendon St, Boston, MA 02116',
      lat: 42.3507,
      lng: -71.0757,
      summary: `A strong match for "${query}". Trinity Church is a Richardsonian Romanesque landmark with rich stonework, civic history, and a calm public edge near Copley Square.`,
      whyVisit:
        'The building is visually distinctive from street level and works well as the anchor for a short Back Bay walking route.',
      facts: [
        { label: 'Built', value: '1872-1877' },
        { label: 'Style', value: 'Romanesque Revival' },
        { label: 'Architect', value: 'H. H. Richardson' },
      ],
      tags: ['Historic Landmark', 'Architecture', 'Back Bay'],
      sources: [
        {
          title: 'Local RAG placeholder',
          snippet:
            'Replace this mock response by adding a backend route at POST /api/rag/search.',
        },
      ],
    },
    {
      id: 'boston-public-library',
      name: 'Boston Public Library',
      category: 'History',
      address: '700 Boylston St, Boston, MA 02116',
      lat: 42.3493,
      lng: -71.0781,
      summary:
        'A nearby cultural landmark with architecture, public interiors, murals, reading rooms, and a central location on Copley Square.',
      facts: [
        { label: 'Area', value: 'Copley Square' },
        { label: 'Type', value: 'Library' },
        { label: 'Walk', value: '3 min' },
      ],
      tags: ['Culture', 'Architecture', 'Indoor Stop'],
      sources: [
        {
          title: 'Local RAG placeholder',
          snippet:
            'This secondary result demonstrates how multiple RAG results can populate the panel and markers.',
        },
      ],
    },
  ]
}

export async function searchPlacesWithRag(query: string): Promise<RagPlaceResult[]> {
  const trimmedQuery = query.trim()

  if (!trimmedQuery) {
    return []
  }

  const response = await fetch(RAG_SEARCH_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: trimmedQuery }),
  }).catch(() => null)

  if (!response || response.status === 404) {
    return buildMockResults(trimmedQuery)
  }

  if (!response.ok) {
    throw new Error('Failed to search places')
  }

  return response.json()
}
