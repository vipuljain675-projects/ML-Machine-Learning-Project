'use client'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'

interface Country {
  country: string
  flag: string
  region: string
  risk_score: number
  risk_level: string
  risk_color: string
}

interface NewsArticle {
  title: string
  source: { name: string }
  publishedAt: string
  url: string
  sentiment?: 'positive' | 'negative' | 'neutral'
}

interface Rivalry {
  country_a: string
  country_b: string
  conflict_probability: number
  risk_color: string
}

const COUNTRY_COORDS: Record<string, [number, number]> = {
  'USA': [37.09, -95.71],
  'Russia': [61.52, 105.31],
  'China': [35.86, 104.19],
  'India': [20.59, 78.96],
  'Iran': [32.42, 53.68],
  'Israel': [31.04, 34.85],
  'UK': [55.37, -3.43],
  'France': [46.22, 2.21],
  'Pakistan': [30.37, 69.34],
  'Saudi Arabia': [23.88, 45.07],
  'Turkey': [38.96, 35.24],
  'Indonesia': [-0.78, 113.92],
  'Afghanistan': [33.93, 67.71],
}

function analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const negative = ['war', 'conflict', 'attack', 'strike', 'missile', 'bomb', 'kill', 'dead', 'crisis', 'tension', 'threat', 'sanction', 'nuclear', 'coup', 'protest', 'clash', 'violence', 'terror', 'explosion']
  const positive = ['peace', 'deal', 'agreement', 'ceasefire', 'negotiation', 'diplomatic', 'cooperation', 'stability', 'growth', 'progress']
  const lower = text.toLowerCase()
  const negScore = negative.filter(w => lower.includes(w)).length
  const posScore = positive.filter(w => lower.includes(w)).length
  if (negScore > posScore) return 'negative'
  if (posScore > negScore) return 'positive'
  return 'neutral'
}

export default function MapPage() {
  const [countries, setCountries] = useState<Country[]>([])
  const [selectedYear, setSelectedYear] = useState(2025)
  const [yearData, setYearData] = useState<Record<string, number>>({})
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  const [news, setNews] = useState<NewsArticle[]>([])
  const [newsLoading, setNewsLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [rivalries, setRivalries] = useState<Rivalry[]>([])
  const [showRivalryLines, setShowRivalryLines] = useState(true)
  const mapRef = useRef<any>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/all-countries`)
      .then(r => r.json())
      .then(data => { setCountries(data); setLoading(false) })
  }, [])

  // Fetch rivalries for selected year
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/rivalries?year=${selectedYear}`)
      .then(r => r.json())
      .then(data => setRivalries(data.filter((r: Rivalry) => r.conflict_probability >= 15)))
  }, [selectedYear])

  useEffect(() => {
    if (countries.length === 0) return
    const fetchForecasts = async () => {
      const newYearData: Record<string, number> = {}
      await Promise.all(
        countries.map(async (c) => {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/country/${encodeURIComponent(c.country)}`)
          const data = await res.json()
          const yearPoint = data.forecast?.find((f: any) => f.year === selectedYear)
          if (yearPoint) newYearData[c.country] = yearPoint.risk_score
        })
      )
      setYearData(newYearData)
    }
    fetchForecasts()
  }, [selectedYear, countries])

  useEffect(() => {
    if (!selectedCountry) return
    setNewsLoading(true)
    const query = selectedCountry === 'UK' ? 'United Kingdom conflict' : `${selectedCountry} conflict geopolitics`
    fetch(`https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=8&language=en&apiKey=${process.env.NEXT_PUBLIC_NEWS_API_KEY}`)
      .then(r => r.json())
      .then(data => {
        const articles = (data.articles || []).map((a: NewsArticle) => ({
          ...a, sentiment: analyzeSentiment(a.title)
        }))
        setNews(articles)
        setNewsLoading(false)
      })
      .catch(() => setNewsLoading(false))
  }, [selectedCountry])

  useEffect(() => {
    if (typeof window === 'undefined' || mapLoaded) return
    const loadMap = async () => {
      const L = (await import('leaflet')).default
      // Fix leaflet CSS import — use dynamic style injection instead
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link')
        link.id = 'leaflet-css'
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(link)
      }
      if (mapRef.current) return
      const map = L.map('map', { center: [25, 20], zoom: 2, zoomControl: true })
      mapRef.current = map
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '©OpenStreetMap ©CartoDB'
      }).addTo(map)
      setMapLoaded(true)
    }
    loadMap()
  }, [])

  // Draw markers
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || Object.keys(yearData).length === 0) return
    const addMarkers = async () => {
      const L = (await import('leaflet')).default
      mapRef.current.eachLayer((layer: any) => {
        if (layer instanceof L.CircleMarker) mapRef.current.removeLayer(layer)
      })
      Object.entries(COUNTRY_COORDS).forEach(([country, coords]) => {
        const score = yearData[country] ?? 0
        const color = getRiskColor(score)
        const radius = Math.max(10, score / 4)
        const marker = L.circleMarker(coords, {
          radius,
          fillColor: color,
          color: '#fff',
          weight: 1.5,
          opacity: 0.8,
          fillOpacity: 0.7,
        }).addTo(mapRef.current)
        marker.bindTooltip(`<b>${country}</b><br/>${score.toFixed(1)}% risk`, { permanent: false })
        marker.on('click', () => setSelectedCountry(country))
      })
    }
    addMarkers()
  }, [mapLoaded, yearData])

  // Draw rivalry lines
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || rivalries.length === 0) return
    const drawLines = async () => {
      const L = (await import('leaflet')).default
      // Remove old rivalry lines
      mapRef.current.eachLayer((layer: any) => {
        if (layer._isRivalryLine) mapRef.current.removeLayer(layer)
      })
      if (!showRivalryLines) return
      rivalries.forEach(r => {
        const coordsA = COUNTRY_COORDS[r.country_a]
        const coordsB = COUNTRY_COORDS[r.country_b]
        if (!coordsA || !coordsB) return
        const opacity = Math.min(0.9, r.conflict_probability / 100 + 0.2)
        const weight = r.conflict_probability >= 70 ? 3 : r.conflict_probability >= 30 ? 2 : 1
        const line = L.polyline([coordsA, coordsB], {
          color: r.risk_color,
          weight,
          opacity,
          dashArray: r.conflict_probability >= 50 ? undefined : '6, 6',
        }).addTo(mapRef.current)
        ;(line as any)._isRivalryLine = true
        line.bindTooltip(
          `<b>${r.country_a} ⚔ ${r.country_b}</b><br/>${r.conflict_probability}% conflict probability`,
          { sticky: true }
        )
      })
    }
    drawLines()
  }, [mapLoaded, rivalries, showRivalryLines])

  const getRiskColor = (score: number) => {
    if (score >= 70) return '#ef4444'
    if (score >= 50) return '#f97316'
    if (score >= 30) return '#eab308'
    return '#22c55e'
  }

  const getSentimentColor = (s: string) => {
    if (s === 'negative') return '#ef4444'
    if (s === 'positive') return '#22c55e'
    return '#94a3b8'
  }

  const getSentimentIcon = (s: string) => {
    if (s === 'negative') return '⚠️'
    if (s === 'positive') return '✅'
    return '📰'
  }

  const getAdjustedRisk = (country: string, baseRisk: number) => {
    if (selectedCountry !== country || news.length === 0) return baseRisk
    const negCount = news.filter(n => n.sentiment === 'negative').length
    const posCount = news.filter(n => n.sentiment === 'positive').length
    return Math.min(100, Math.max(0, baseRisk + (negCount - posCount) * 2))
  }

  return (
    <main style={{ minHeight: '100vh', background: '#0a0a0f', color: '#e2e8f0', fontFamily: "'Space Mono', monospace", display: 'flex', flexDirection: 'column' }}>
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <Link href="/" style={{ color: '#475569', textDecoration: 'none', fontSize: 11, letterSpacing: 3 }}>← BACK TO MONITOR</Link>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc', letterSpacing: 3 }}>CONFLICT MAP {selectedYear}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Toggle rivalry lines */}
          <button onClick={() => setShowRivalryLines(v => !v)} style={{
            fontSize: 10, letterSpacing: 2, cursor: 'pointer', padding: '4px 12px',
            borderRadius: 4, border: `1px solid ${showRivalryLines ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
            background: showRivalryLines ? 'rgba(239,68,68,0.15)' : 'transparent',
            color: showRivalryLines ? '#ef4444' : '#64748b',
          }}>
            ⚔ {showRivalryLines ? 'HIDE' : 'SHOW'} RIVALRIES
          </button>
          <div style={{ fontSize: 11, color: '#22c55e', letterSpacing: 2 }}>● LIVE NEWS FEED</div>
        </div>
      </div>

      <div style={{ padding: '16px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ fontSize: 10, letterSpacing: 3, color: '#475569', whiteSpace: 'nowrap' }}>FORECAST YEAR</div>
          <input type="range" min={2025} max={2040} value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            style={{ flex: 1, accentColor: '#ef4444', cursor: 'pointer' }} />
          <div style={{ fontSize: 24, fontWeight: 700, color: '#f8fafc', minWidth: 60 }}>{selectedYear}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[2025, 2028, 2030, 2035, 2040].map(y => (
              <button key={y} onClick={() => setSelectedYear(y)}
                style={{ padding: '4px 12px', borderRadius: 4, border: '1px solid', fontSize: 11, cursor: 'pointer',
                  borderColor: selectedYear === y ? '#ef4444' : 'rgba(255,255,255,0.1)',
                  background: selectedYear === y ? 'rgba(239,68,68,0.15)' : 'transparent',
                  color: selectedYear === y ? '#ef4444' : '#64748b' }}>
                {y}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Rivalry legend */}
      {showRivalryLines && rivalries.length > 0 && (
        <div style={{ padding: '8px 32px', background: 'rgba(239,68,68,0.05)', borderBottom: '1px solid rgba(239,68,68,0.1)', display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 9, letterSpacing: 3, color: '#475569' }}>RIVALRY LINES:</span>
          {[
            { label: 'CRITICAL 70%+', color: '#ef4444', dash: false },
            { label: 'MODERATE 30%+', color: '#eab308', dash: true },
            { label: 'LOW <30%', color: '#22c55e', dash: true },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 24, height: 2, background: l.color, opacity: 0.8, borderTop: l.dash ? `2px dashed ${l.color}` : undefined }} />
              <span style={{ fontSize: 9, color: '#475569', letterSpacing: 1 }}>{l.label}</span>
            </div>
          ))}
          <span style={{ fontSize: 9, color: '#475569', marginLeft: 'auto' }}>{rivalries.length} ACTIVE RIVALRIES SHOWN</span>
        </div>
      )}

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div id="map" style={{ width: '100%', height: '420px' }} />

          <div style={{ padding: 20, overflowY: 'auto' }}>
            <div style={{ fontSize: 10, letterSpacing: 3, color: '#475569', marginBottom: 12 }}>
              CLICK A BUBBLE ON MAP OR CARD BELOW — {selectedYear} RISK SCORES
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
              {countries.map(c => {
                const score = yearData[c.country] ?? c.risk_score
                const adjusted = getAdjustedRisk(c.country, score)
                const isSelected = selectedCountry === c.country
                const color = getRiskColor(adjusted)
                return (
                  <div key={c.country} onClick={() => setSelectedCountry(isSelected ? null : c.country)}
                    style={{ background: isSelected ? `${color}20` : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isSelected ? color : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: 8, padding: '10px 14px', cursor: 'pointer', transition: 'all 0.2s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 16 }}>{c.flag}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#f8fafc' }}>{c.country}</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color }}>{adjusted.toFixed(1)}%</span>
                    </div>
                    <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2 }}>
                      <div style={{ height: '100%', width: `${adjusted}%`, background: color, borderRadius: 2, transition: 'width 0.5s' }} />
                    </div>
                    {isSelected && news.length > 0 && (
                      <div style={{ marginTop: 6, fontSize: 9, color: '#475569' }}>
                        {news.filter(n => n.sentiment === 'negative').length} negative signals
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: 20, marginTop: 16, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              {[['CRITICAL', '#ef4444', '70%+'], ['HIGH', '#f97316', '50-70%'], ['MODERATE', '#eab308', '30-50%'], ['LOW', '#22c55e', '<30%']].map(([label, color, range]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
                  <span style={{ fontSize: 10, color: '#64748b', letterSpacing: 1 }}>{label} ({range})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ width: 360, borderLeft: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ fontSize: 10, letterSpacing: 3, color: '#475569', marginBottom: 6 }}>LIVE INTELLIGENCE FEED</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc' }}>
              {selectedCountry ? `${countries.find(c => c.country === selectedCountry)?.flag} ${selectedCountry}` : 'SELECT A COUNTRY'}
            </div>
            {selectedCountry && yearData[selectedCountry] && (
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, color: '#475569' }}>BASE:</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: getRiskColor(yearData[selectedCountry]) }}>{yearData[selectedCountry]}%</span>
                {news.length > 0 && (
                  <>
                    <span style={{ fontSize: 11, color: '#475569' }}>NEWS ADJUSTED:</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: getRiskColor(getAdjustedRisk(selectedCountry, yearData[selectedCountry])) }}>
                      {getAdjustedRisk(selectedCountry, yearData[selectedCountry]).toFixed(1)}%
                    </span>
                  </>
                )}
              </div>
            )}
            {/* Show rivalries for selected country */}
            {selectedCountry && rivalries.filter(r => r.country_a === selectedCountry || r.country_b === selectedCountry).length > 0 && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 9, letterSpacing: 3, color: '#475569', marginBottom: 6 }}>TOP RIVALRIES</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {rivalries
                    .filter(r => r.country_a === selectedCountry || r.country_b === selectedCountry)
                    .slice(0, 3)
                    .map((r, i) => {
                      const opponent = r.country_a === selectedCountry ? r.country_b : r.country_a
                      const opFlag = countries.find(c => c.country === opponent)?.flag || '🏳️'
                      return (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px', background: `${r.risk_color}10`, borderRadius: 4, border: `1px solid ${r.risk_color}25` }}>
                          <span style={{ fontSize: 11 }}>{opFlag} {opponent}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: r.risk_color }}>{r.conflict_probability}%</span>
                        </div>
                      )
                    })}
                </div>
              </div>
            )}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
            {!selectedCountry && (
              <div style={{ textAlign: 'center', padding: 40, color: '#334155' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🌍</div>
                <div style={{ fontSize: 11, letterSpacing: 2 }}>CLICK A BUBBLE ON THE MAP OR A COUNTRY CARD TO LOAD LIVE NEWS</div>
              </div>
            )}
            {newsLoading && <div style={{ textAlign: 'center', padding: 40, color: '#475569', fontSize: 11, letterSpacing: 4 }}>FETCHING INTELLIGENCE...</div>}
            {!newsLoading && news.map((article, i) => (
              <a key={i} href={article.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textDecoration: 'none', marginBottom: 10 }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', borderLeft: `3px solid ${getSentimentColor(article.sentiment!)}`,
                  border: `1px solid ${getSentimentColor(article.sentiment!)}20`, borderRadius: 6, padding: '10px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 9, letterSpacing: 1, color: getSentimentColor(article.sentiment!), background: `${getSentimentColor(article.sentiment!)}15`, padding: '2px 6px', borderRadius: 3 }}>
                      {getSentimentIcon(article.sentiment!)} {article.sentiment?.toUpperCase()}
                    </span>
                    <span style={{ fontSize: 9, color: '#334155' }}>{new Date(article.publishedAt).toLocaleDateString()}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#cbd5e1', lineHeight: 1.5, marginBottom: 4 }}>{article.title}</div>
                  <div style={{ fontSize: 9, color: '#475569' }}>{article.source.name}</div>
                </div>
              </a>
            ))}
          </div>

          {news.length > 0 && selectedCountry && (
            <div style={{ padding: 16, borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ fontSize: 10, letterSpacing: 3, color: '#475569', marginBottom: 10 }}>SENTIMENT ANALYSIS</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {[
                  { label: 'NEGATIVE', count: news.filter(n => n.sentiment === 'negative').length, color: '#ef4444' },
                  { label: 'NEUTRAL', count: news.filter(n => n.sentiment === 'neutral').length, color: '#94a3b8' },
                  { label: 'POSITIVE', count: news.filter(n => n.sentiment === 'positive').length, color: '#22c55e' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center', background: `${s.color}10`, border: `1px solid ${s.color}25`, borderRadius: 6, padding: '8px' }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.count}</div>
                    <div style={{ fontSize: 8, letterSpacing: 2, color: '#475569', marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}