import { useEffect, useRef, useState, type FormEvent } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import ResultPanel from './ResultPanel'
import { searchPlacesWithRag } from '../services/ragApi'
import type { RagPlaceResult } from '../types/rag'

type Gem = {
  id: number
  name: string
  category: string
  address: string
  lng: number
  lat: number
}

const gems: Gem[] = [
  {
    id: 1,
    name: 'Trinity Church',
    category: 'Architectural Gem',
    address: '206 Clarendon St, Boston, MA',
    lng: -71.0757,
    lat: 42.3507,
  },
  {
    id: 2,
    name: 'Boston Public Library',
    category: 'History',
    address: '700 Boylston St, Boston, MA',
    lng: -71.0781,
    lat: 42.3493,
  },
  {
    id: 3,
    name: 'Old South Church',
    category: 'Hidden Gem',
    address: '645 Boylston St, Boston, MA',
    lng: -71.0771,
    lat: 42.3501,
  },
  {
    id: 4,
    name: 'Gibson House Museum',
    category: 'Culture',
    address: '137 Beacon St, Boston, MA',
    lng: -71.0727,
    lat: 42.3552,
  },
]

const filters = ['All', 'Architecture', 'History', 'Hidden Gems', 'Nature', 'Art & Culture', 'Cafes']
const navItems = [
  { label: 'Explore', icon: 'compass' },
  { label: 'Tours', icon: 'map' },
  { label: 'Map Layers', icon: 'layers' },
  { label: 'Collections', icon: 'collection' },
  { label: 'AI Chat', icon: 'chat' },
  { label: 'Settings', icon: 'settings' },
]

function NavIcon({ name }: { name: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {name === 'compass' ? (
        <>
          <circle cx="12" cy="12" r="8" />
          <path d="m15.6 8.4-2.1 5.1-5.1 2.1 2.1-5.1 5.1-2.1Z" />
        </>
      ) : null}
      {name === 'map' ? (
        <>
          <path d="m8 5 8-2 4 2v14l-8 2-8-2V5l4 2Z" />
          <path d="M8 7v14" />
          <path d="M16 3v14" />
        </>
      ) : null}
      {name === 'layers' ? (
        <>
          <path d="m12 4 8 4-8 4-8-4 8-4Z" />
          <path d="m4 12 8 4 8-4" />
          <path d="m4 16 8 4 8-4" />
        </>
      ) : null}
      {name === 'collection' ? (
        <>
          <path d="M5 7.5A2.5 2.5 0 0 1 7.5 5H18a1 1 0 0 1 1 1v13H7.5A2.5 2.5 0 0 1 5 16.5v-9Z" />
          <path d="M8 5V3" />
          <path d="M16 5V3" />
          <path d="M8 10h7" />
        </>
      ) : null}
      {name === 'chat' ? (
        <>
          <path d="M5 6.5A3.5 3.5 0 0 1 8.5 3h7A3.5 3.5 0 0 1 19 6.5v4a3.5 3.5 0 0 1-3.5 3.5H12l-4.5 4v-4A3.5 3.5 0 0 1 5 10.5v-4Z" />
          <path d="M9 8h6" />
          <path d="M9 11h4" />
        </>
      ) : null}
      {name === 'settings' ? (
        <>
          <path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z" />
          <path d="M19 12a6.8 6.8 0 0 0-.1-1l2-1.5-2-3.4-2.4 1a7.8 7.8 0 0 0-1.8-1L14.4 3h-4l-.4 3.1a7.8 7.8 0 0 0-1.8 1l-2.4-1-2 3.4 2 1.5a6.8 6.8 0 0 0 0 2l-2 1.5 2 3.4 2.4-1a7.8 7.8 0 0 0 1.8 1l.4 3.1h4l.4-3.1a7.8 7.8 0 0 0 1.8-1l2.4 1 2-3.4-2-1.5c.1-.3.1-.7.1-1Z" />
        </>
      ) : null}
    </svg>
  )
}

function MapMarker({ gem, active }: { gem: Gem; active?: boolean }) {
  return (
    <button
      className={`map-marker ${active ? 'active' : ''}`}
      style={{
        left: `${49 + (gem.lng + 71.0757) * 2300}%`,
        top: `${48 - (gem.lat - 42.3507) * 2400}%`,
      }}
      aria-label={gem.name}
      type="button"
    >
      <span>{gem.id === 1 ? 'A' : gem.id}</span>
    </button>
  )
}

function MapView() {
  const mapContainer = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<RagPlaceResult[]>([])
  const [selectedResult, setSelectedResult] = useState<RagPlaceResult | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  const markerGems =
    results.length > 0
      ? results
          .filter((result) => typeof result.lng === 'number' && typeof result.lat === 'number')
          .map((result, index) => ({
            id: index + 1,
            name: result.name,
            category: result.category,
            address: result.address ?? '',
            lng: result.lng as number,
            lat: result.lat as number,
          }))
      : gems

  useEffect(() => {
    const token = import.meta.env.VITE_MAPBOX_TOKEN

    if (!mapContainer.current || !token) {
      return
    }

    mapboxgl.accessToken = token

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-71.0757, 42.3507],
      zoom: 15.6,
      pitch: 62,
      bearing: -28,
      antialias: true,
      attributionControl: false,
    })

    mapRef.current = map

    map.on('load', () => {
      setMapReady(true)

      const layers = map.getStyle().layers
      const labelLayerId = layers?.find(
        (layer) => layer.type === 'symbol' && layer.layout?.['text-field'],
      )?.id

      map.addLayer(
        {
          id: '3d-buildings',
          source: 'composite',
          'source-layer': 'building',
          filter: ['==', 'extrude', 'true'],
          type: 'fill-extrusion',
          minzoom: 14,
          paint: {
            'fill-extrusion-color': [
              'case',
              ['==', ['id'], 171132709],
              '#5b4ce6',
              '#d8d3c6',
            ],
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-base': ['get', 'min_height'],
            'fill-extrusion-opacity': 0.72,
          },
        },
        labelLayerId,
      )
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    if (
      typeof selectedResult?.lng !== 'number' ||
      typeof selectedResult.lat !== 'number' ||
      !mapRef.current
    ) {
      return
    }

    mapRef.current.flyTo({
      center: [selectedResult.lng, selectedResult.lat],
      zoom: 16,
      pitch: 62,
      bearing: -28,
      essential: true,
    })
  }, [selectedResult])

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!query.trim()) {
      setResults([])
      setSelectedResult(null)
      setSearchError(null)
      return
    }

    setIsSearching(true)
    setSearchError(null)

    try {
      const nextResults = await searchPlacesWithRag(query)
      setResults(nextResults)
      setSelectedResult(nextResults[0] ?? null)
    } catch {
      setSearchError('Search failed. Please try again after the RAG API is available.')
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="brand">
          <div className="brand-mark">UG</div>
          <div>
            <strong>UrbanGem</strong>
            <span>See cities differently.</span>
          </div>
        </div>

        <nav className="side-nav">
          {navItems.map((item) => (
            <button className={item.label === 'Explore' ? 'selected' : ''} key={item.label} type="button">
              <span className="nav-icon">
                <NavIcon name={item.icon} />
              </span>
              {item.label}
              {item.label === 'AI Chat' ? <small>BETA</small> : null}
            </button>
          ))}
        </nav>

        <div className="tour-card">
          <span className="eyebrow">AI Suggested Tour</span>
          <h2>Hidden Architecture in Back Bay</h2>
          <p className="tour-meta">2.1 km · 12 stops · ~2h</p>
          <p>Explore overlooked landmarks and quiet streets full of stories most tourists miss.</p>
          <button type="button">Start Tour</button>
          <span className="preview-link">Preview Stops</span>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <form className="search" onSubmit={handleSearch} role="search">
            <span>Search</span>
            <input
              aria-label="Search places"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ask about places, buildings, or neighborhoods..."
              value={query}
            />
            <button type="submit">Go</button>
          </form>
          <div className="top-actions">
            <button className="active" type="button">Explore</button>
            <button type="button">Tours</button>
            <button type="button">Saved</button>
            <img
              alt="User profile"
              src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=96&q=80"
            />
          </div>
        </header>

        <section className="content">
          <div className="map-panel">
            <div className="filter-row">
              {filters.map((filter) => (
                <button className={filter === 'All' ? 'active' : ''} key={filter} type="button">
                  {filter}
                </button>
              ))}
            </div>

            <div className="map-stage">
              <div ref={mapContainer} className="mapbox-canvas" />
              <div className={`fallback-map ${mapReady ? 'hidden' : ''}`} aria-hidden="true" />
              <div className="route-line" aria-hidden="true" />
              {markerGems.map((gem) => (
                <MapMarker
                  active={gem.name === selectedResult?.name || (!selectedResult && gem.id === 1)}
                  gem={gem}
                  key={gem.name}
                />
              ))}
              <div className="building-pin">
                <span />
              </div>
              <div className="map-controls">
                <button type="button">+</button>
                <button type="button">-</button>
                <button type="button">3D</button>
              </div>
              <button className="prompt-pill" type="button">Show me something...</button>
              <button className="legend-pill" type="button">Legend</button>
            </div>
          </div>

          <ResultPanel
            error={searchError}
            loading={isSearching}
            onSelectResult={setSelectedResult}
            result={selectedResult}
            results={results}
          />
        </section>
      </main>
    </div>
  )
}

export default MapView
