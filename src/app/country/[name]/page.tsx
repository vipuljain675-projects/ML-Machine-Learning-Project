'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

interface ForecastPoint {
  year: number
  risk_score: number
  risk_level: string
  gdp_growth: number
  military_spend: number
  inflation: number
}

interface CountryDetail {
  country: string
  flag: string
  region: string
  current_risk: number
  risk_level: string
  risk_color: string
  forecast: ForecastPoint[]
  key_indicators: {
    gdp_growth: number
    military_spend: number
    inflation: number
    unemployment: number
  }
}

export default function CountryPage() {
  const params = useParams()
  const [data, setData] = useState<CountryDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const country = decodeURIComponent(params.name as string)
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/country/${encodeURIComponent(country)}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
  }, [params.name])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontFamily: "'Space Mono', monospace", letterSpacing: 4 }}>
      LOADING...
    </div>
  )
  if (!data) return null

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div style={{ background: '#0f172a', border: `1px solid ${data.risk_color}40`, padding: '12px 16px', borderRadius: 6 }}>
          <div style={{ color: '#94a3b8', fontSize: 11, marginBottom: 6 }}>{label}</div>
          <div style={{ color: data.risk_color, fontSize: 18, fontWeight: 700 }}>{payload[0].value}%</div>
          <div style={{ color: '#64748b', fontSize: 10, marginTop: 4 }}>{payload[0].payload.risk_level}</div>
        </div>
      )
    }
    return null
  }

  return (
    <main style={{ minHeight: '100vh', background: '#0a0a0f', color: '#e2e8f0', fontFamily: "'Space Mono', monospace" }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '24px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ color: '#475569', textDecoration: 'none', fontSize: 11, letterSpacing: 3, display: 'flex', alignItems: 'center', gap: 8 }}>
          ← BACK TO MONITOR
        </Link>
        <div style={{ fontSize: 11, letterSpacing: 4, color: '#64748b' }}>COUNTRY INTELLIGENCE REPORT</div>
      </div>

      <div style={{ padding: '40px 40px' }}>
        {/* Country Hero */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 32, marginBottom: 48 }}>
          <div style={{ fontSize: 80 }}>{data.flag}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, letterSpacing: 4, color: '#475569', marginBottom: 8 }}>{data.region}</div>
            <h1 style={{ fontSize: 48, fontWeight: 700, margin: '0 0 16px', color: '#f8fafc' }}>{data.country}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ fontSize: 56, fontWeight: 700, color: data.risk_color }}>{data.current_risk}%</div>
              <div>
                <div style={{ fontSize: 11, letterSpacing: 3, color: '#475569', marginBottom: 6 }}>CONFLICT PROBABILITY</div>
                <div style={{ padding: '4px 14px', borderRadius: 4, fontSize: 12, fontWeight: 700, letterSpacing: 2, background: `${data.risk_color}20`, color: data.risk_color, border: `1px solid ${data.risk_color}40`, display: 'inline-block' }}>
                  {data.risk_level}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Indicators */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 48 }}>
          {[
            { label: 'GDP GROWTH', value: `${data.key_indicators.gdp_growth}%`, good: data.key_indicators.gdp_growth > 0 },
            { label: 'MILITARY SPEND', value: `${data.key_indicators.military_spend}% GDP`, good: data.key_indicators.military_spend < 3 },
            { label: 'INFLATION', value: `${data.key_indicators.inflation}%`, good: data.key_indicators.inflation < 5 },
            { label: 'UNEMPLOYMENT', value: `${data.key_indicators.unemployment}%`, good: data.key_indicators.unemployment < 6 },
          ].map((ind, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '20px 24px' }}>
              <div style={{ fontSize: 10, letterSpacing: 3, color: '#475569', marginBottom: 12 }}>{ind.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: ind.good ? '#22c55e' : '#ef4444' }}>{ind.value}</div>
            </div>
          ))}
        </div>

        {/* Forecast Chart */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 32, marginBottom: 48 }}>
          <div style={{ fontSize: 11, letterSpacing: 4, color: '#64748b', marginBottom: 6 }}>CONFLICT RISK FORECAST</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#f8fafc', marginBottom: 32 }}>2025 — 2040 Probability Trajectory</div>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={data.forecast}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="year" stroke="#475569" tick={{ fontSize: 11, fill: '#475569' }} />
              <YAxis stroke="#475569" tick={{ fontSize: 11, fill: '#475569' }} domain={[0, 100]} tickFormatter={v => `${v}%`} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={50} stroke="#ef4444" strokeDasharray="4 4" label={{ value: '50% THRESHOLD', fill: '#ef4444', fontSize: 10 }} />
              <Line type="monotone" dataKey="risk_score" stroke={data.risk_color} strokeWidth={2.5} dot={{ fill: data.risk_color, r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Forecast Table */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 11, letterSpacing: 4, color: '#64748b' }}>YEAR-BY-YEAR BREAKDOWN</div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                {['YEAR', 'RISK SCORE', 'LEVEL', 'GDP GROWTH', 'MILITARY SPEND', 'INFLATION'].map(h => (
                  <th key={h} style={{ padding: '12px 24px', textAlign: 'left', fontSize: 10, letterSpacing: 2, color: '#475569', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.forecast.map((row, i) => (
                <tr key={row.year} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                  <td style={{ padding: '14px 24px', fontSize: 13, fontWeight: 700, color: '#94a3b8' }}>{row.year}</td>
                  <td style={{ padding: '14px 24px', fontSize: 16, fontWeight: 700, color: data.risk_color }}>{row.risk_score}%</td>
                  <td style={{ padding: '14px 24px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 3, fontSize: 10, letterSpacing: 1, background: `${data.risk_color}15`, color: data.risk_color }}>{row.risk_level}</span>
                  </td>
                  <td style={{ padding: '14px 24px', fontSize: 13, color: row.gdp_growth > 0 ? '#22c55e' : '#ef4444' }}>{row.gdp_growth > 0 ? '+' : ''}{row.gdp_growth}%</td>
                  <td style={{ padding: '14px 24px', fontSize: 13, color: '#94a3b8' }}>{row.military_spend}%</td>
                  <td style={{ padding: '14px 24px', fontSize: 13, color: row.inflation > 10 ? '#ef4444' : '#94a3b8' }}>{row.inflation}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}