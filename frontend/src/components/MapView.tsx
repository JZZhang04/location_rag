import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

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
          <label className="search">
            <span>Search</span>
            <input placeholder="Ask about places, buildings, or neighborhoods..." />
            <kbd>⌘ K</kbd>
          </label>
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
              {gems.map((gem) => (
                <MapMarker active={gem.id === 1} gem={gem} key={gem.id} />
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

          <aside className="detail-panel" aria-label="Selected place">
            <div className="detail-actions">
              <button type="button">Back to map</button>
              <button type="button">Save</button>
            </div>

            <div className="photo-grid">
              <img
                className="main-photo"
                alt="Trinity Church facade"
                src="https://images.unsplash.com/photo-1573050974892-3d49f11695a7?auto=format&fit=crop&w=900&q=80"
              />
              <img
                alt="Stone detail"
                src="https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=320&q=80"
              />
              <img
                alt="Church interior"
                src="https://images.unsplash.com/photo-1548625361-58a9b86aa83b?auto=format&fit=crop&w=320&q=80"
              />
              <div className="more-photos">+12</div>
            </div>

            <div className="place-title">
              <h1>Trinity Church</h1>
              <span>Architectural Gem</span>
            </div>
            <p className="address">206 Clarendon St, Boston, MA 02116</p>

            <div className="facts">
              <div>
                <span>Built</span>
                <strong>1872-1877</strong>
              </div>
              <div>
                <span>Style</span>
                <strong>Romanesque Revival</strong>
              </div>
              <div>
                <span>Architect</span>
                <strong>H. H. Richardson</strong>
              </div>
            </div>

            <section className="copy-block">
              <h2>Why it's worth seeing</h2>
              <p>
                One of Richardson's masterpieces. The rich stonework, intricate carvings,
                and peaceful courtyard make it a hidden oasis in the heart of Back Bay.
              </p>
              <div className="tags">
                <span>Historic Landmark</span>
                <span>Religious Architecture</span>
                <span>Hidden Gem</span>
              </div>
            </section>

            <section className="insight">
              <h2>AI Insight</h2>
              <p>
                Trinity Church blends medieval European influence with local Roxbury
                conglomerate stone, giving it a distinctly Boston identity.
              </p>
              <a href="#sources">Sources (4)</a>
            </section>

            <section className="nearby">
              <div>
                <h2>Nearby Gems</h2>
                <a href="#nearby">See all</a>
              </div>
              <div className="nearby-grid">
                {gems.slice(1).map((gem, index) => (
                  <article key={gem.id}>
                    <img
                      alt=""
                      src={`https://images.unsplash.com/photo-${[
                        '1565060169194-19fabf63012c',
                        '1605727216801-e27ce1d0cc28',
                        '1511818966892-d7d671e672a2',
                      ][index]}?auto=format&fit=crop&w=260&q=80`}
                    />
                    <strong>{gem.name}</strong>
                    <span>{6 + index * 2} min walk</span>
                  </article>
                ))}
              </div>
            </section>
          </aside>
        </section>
      </main>
    </div>
  )
}

export default MapView
