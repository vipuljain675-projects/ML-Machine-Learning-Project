'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Country {
  country: string
  flag: string
  region: string
  risk_score: number
  risk_level: string
  risk_color: string
}

export default function Home() {
  const [countries, setCountries] = useState<Country[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/all-countries`)
      .then(r => r.json())
      .then(data => { setCountries(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const regions = ['ALL', 'Asia', 'Middle East', 'Europe', 'Americas', 'Europe/Asia', 'Middle East/Europe']
  const filtered = filter === 'ALL' ? countries : countries.filter(c => c.region === filter)

  const getRiskBg = (level: string) => {
    if (level === 'CRITICAL') return 'rgba(239,68,68,0.15)'
    if (level === 'HIGH') return 'rgba(249,115,22,0.15)'
    if (level === 'MODERATE') return 'rgba(234,179,8,0.15)'
    return 'rgba(34,197,94,0.15)'
  }

  return (
    <main style={{ minHeight: '100vh', background: '#0a0a0f', color: '#e2e8f0', fontFamily: "'Space Mono', monospace" }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '24px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 4, color: '#64748b', marginBottom: 6 }}>CLASSIFIED INTELLIGENCE SYSTEM</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, background: 'linear-gradient(135deg, #f8fafc, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            GEOPOLITICAL RISK MONITOR
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/map" style={{ padding: '8px 20px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.15)', fontSize: 11, letterSpacing: 2, color: '#94a3b8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#94a3b8')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)')}>
            🗺️ CONFLICT MAP
          </Link>
          <Link href="/rivalries" style={{ padding: '8px 20px', borderRadius: 4, border: '1px solid rgba(239,68,68,0.4)', fontSize: 11, letterSpacing: 2, color: '#ef4444', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#ef4444')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)')}>
            ⚔ RIVALRIES
          </Link>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: '#64748b', letterSpacing: 2 }}>MODEL STATUS</div>
            <div style={{ fontSize: 13, color: '#22c55e', marginTop: 4 }}>● LIVE — 97.3% ACCURACY</div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
        {[
          { label: 'COUNTRIES MONITORED', value: countries.length },
          { label: 'CRITICAL RISK', value: countries.filter(c => c.risk_level === 'CRITICAL').length, color: '#ef4444' },
          { label: 'HIGH RISK', value: countries.filter(c => c.risk_level === 'HIGH').length, color: '#f97316' },
          { label: 'DATA POINTS', value: '9,888' },
        ].map((stat, i) => (
          <div key={i} style={{ padding: '20px 32px', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
            <div style={{ fontSize: 10, letterSpacing: 3, color: '#475569', marginBottom: 8 }}>{stat.label}</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: stat.color || '#f8fafc' }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: '32px 40px' }}>
        {/* Filter */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap' }}>
          {regions.map(r => (
            <button key={r} onClick={() => setFilter(r)}
              style={{ padding: '6px 16px', borderRadius: 4, border: '1px solid', fontSize: 11, letterSpacing: 2, cursor: 'pointer', transition: 'all 0.2s',
                borderColor: filter === r ? '#94a3b8' : 'rgba(255,255,255,0.1)',
                background: filter === r ? 'rgba(148,163,184,0.15)' : 'transparent',
                color: filter === r ? '#f8fafc' : '#64748b' }}>
              {r}
            </button>
          ))}
        </div>

        {/* Country Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 80, color: '#475569' }}>
            <div style={{ fontSize: 14, letterSpacing: 4 }}>LOADING INTELLIGENCE DATA...</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {filtered.map((c, i) => (
              <Link key={c.country} href={`/country/${encodeURIComponent(c.country)}`} style={{ textDecoration: 'none' }}>
                <div style={{ background: getRiskBg(c.risk_level), border: `1px solid ${c.risk_color}30`, borderRadius: 8, padding: 24, cursor: 'pointer', transition: 'all 0.2s', position: 'relative', overflow: 'hidden' }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
                  <div style={{ position: 'absolute', top: 16, right: 16, fontSize: 11, color: '#475569', letterSpacing: 2 }}>#{i + 1}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <span style={{ fontSize: 28 }}>{c.flag}</span>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc' }}>{c.country}</div>
                      <div style={{ fontSize: 10, color: '#475569', letterSpacing: 2, marginTop: 2 }}>{c.region}</div>
                    </div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 10, letterSpacing: 3, color: '#64748b' }}>CONFLICT RISK</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: c.risk_color }}>{c.risk_score}%</span>
                    </div>
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2 }}>
                      <div style={{ height: '100%', width: `${c.risk_score}%`, background: c.risk_color, borderRadius: 2, transition: 'width 1s ease' }} />
                    </div>
                  </div>
                  <div style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 3, fontSize: 10, letterSpacing: 2, fontWeight: 700, background: `${c.risk_color}25`, color: c.risk_color, border: `1px solid ${c.risk_color}40` }}>
                    {c.risk_level}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#334155', letterSpacing: 2 }}>
          <span>TRAINED ON UCDP + WORLD BANK DATA (1946–2024)</span>
          <span>9,888 HISTORICAL DATA POINTS</span>
        </div>
      </div>
    </main>
  )
}