'use client';
import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';

interface PairForecast {
  country_a: string;
  country_b: string;
  flag_a: string;
  flag_b: string;
  current_probability: number;
  risk_level: string;
  forecast: { year: number; probability: number }[];
}

export default function PairPage({ params }: { params: Promise<{ pair: string[] }> }) {
  const { pair } = use(params);
  const countryA = decodeURIComponent(pair[0]);
  const countryB = decodeURIComponent(pair[1]);
  const [data, setData] = useState<PairForecast | null>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/rivalries/pair/${encodeURIComponent(countryA)}/${encodeURIComponent(countryB)}`)
      .then(r => r.json())
      .then(setData);
  }, [countryA, countryB]);

  const getRiskColor = (p: number) => {
    if (p >= 70) return '#ef4444';
    if (p >= 50) return '#f97316';
    if (p >= 30) return '#eab308';
    return '#22c55e';
  };

  if (!data) return (
    <div style={{ minHeight: '100vh', background: '#080808', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333', fontFamily: 'Courier New', letterSpacing: 4 }}>
      LOADING PAIR INTELLIGENCE...
    </div>
  );

  const color = getRiskColor(data.current_probability);
  const peak = Math.max(...data.forecast.map(f => f.probability));
  const peakYear = data.forecast.find(f => f.probability === peak)?.year;

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#e0e0e0', fontFamily: "'Courier New', monospace" }}>
      {/* Header */}
      <div style={{
        borderBottom: '1px solid #1a1a1a', padding: '20px 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#0a0a0a',
      }}>
        <Link href="/rivalries" style={{ color: '#666', textDecoration: 'none', fontSize: 12, letterSpacing: 2 }}>
          ← BACK TO RIVALRIES
        </Link>
        <div style={{ fontSize: 10, color: '#444', letterSpacing: 4 }}>DYADIC CONFLICT ANALYSIS</div>
      </div>

      <div style={{ padding: '40px' }}>
        {/* Hero */}
        <div style={{
          background: '#0f0f0f', border: `1px solid ${color}33`,
          borderRadius: 8, padding: '40px', marginBottom: 30,
          textAlign: 'center', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: `radial-gradient(ellipse at center, ${color}08 0%, transparent 70%)`,
            pointerEvents: 'none',
          }} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 40, marginBottom: 30 }}>
            <div>
              <div style={{ fontSize: 64 }}>{data.flag_a}</div>
              <div style={{ fontSize: 14, color: '#aaa', letterSpacing: 3, marginTop: 8 }}>{data.country_a}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 40, color: color }}>⚔</div>
              <div style={{ fontSize: 11, color: '#444', letterSpacing: 3, marginTop: 8 }}>VS</div>
            </div>
            <div>
              <div style={{ fontSize: 64 }}>{data.flag_b}</div>
              <div style={{ fontSize: 14, color: '#aaa', letterSpacing: 3, marginTop: 8 }}>{data.country_b}</div>
            </div>
          </div>

          <div style={{ fontSize: 72, fontWeight: 'bold', color, marginBottom: 8 }}>
            {data.current_probability}%
          </div>
          <div style={{ fontSize: 14, color, letterSpacing: 4 }}>{data.risk_level} CONFLICT PROBABILITY — 2025</div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 40, marginTop: 30 }}>
            <div>
              <div style={{ fontSize: 9, color: '#444', letterSpacing: 3 }}>PEAK RISK</div>
              <div style={{ fontSize: 20, color: '#ef4444', fontWeight: 'bold' }}>{peak}%</div>
              <div style={{ fontSize: 10, color: '#666' }}>in {peakYear}</div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: '#444', letterSpacing: 3 }}>2040 OUTLOOK</div>
              <div style={{ fontSize: 20, color: getRiskColor(data.forecast[data.forecast.length - 1]?.probability || 0), fontWeight: 'bold' }}>
                {data.forecast[data.forecast.length - 1]?.probability}%
              </div>
              <div style={{ fontSize: 10, color: '#666' }}>long term</div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div style={{ background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: 8, padding: '30px', marginBottom: 30 }}>
          <div style={{ fontSize: 10, color: '#444', letterSpacing: 4, marginBottom: 20 }}>
            CONFLICT PROBABILITY FORECAST 2025–2040
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.forecast}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
              <XAxis dataKey="year" stroke="#333" tick={{ fill: '#666', fontSize: 11 }} />
              <YAxis stroke="#333" tick={{ fill: '#666', fontSize: 11 }} domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} />
              <Tooltip
                contentStyle={{ background: '#111', border: `1px solid ${color}`, borderRadius: 4, fontFamily: 'Courier New' }}
                formatter={(value: number) => [`${value}%`, 'Conflict Probability']}
              />
              <ReferenceLine y={50} stroke="#ef444466" strokeDasharray="4 4" label={{ value: '50% THRESHOLD', fill: '#ef4444', fontSize: 9 }} />
              <Line
                type="monotone" dataKey="probability" stroke={color}
                strokeWidth={2} dot={{ fill: color, r: 4 }}
                activeDot={{ r: 6, fill: color }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Year by Year Table */}
        <div style={{ background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: 8, padding: '30px' }}>
          <div style={{ fontSize: 10, color: '#444', letterSpacing: 4, marginBottom: 20 }}>YEAR-BY-YEAR BREAKDOWN</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {data.forecast.map(f => (
              <div key={f.year} style={{
                background: '#0a0a0a', border: `1px solid ${getRiskColor(f.probability)}22`,
                borderRadius: 4, padding: '12px 16px',
                borderLeft: `3px solid ${getRiskColor(f.probability)}`,
              }}>
                <div style={{ fontSize: 11, color: '#555', letterSpacing: 2 }}>{f.year}</div>
                <div style={{ fontSize: 20, fontWeight: 'bold', color: getRiskColor(f.probability) }}>{f.probability}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}