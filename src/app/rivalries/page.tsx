'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Rivalry {
  country_a: string;
  country_b: string;
  flag_a: string;
  flag_b: string;
  conflict_probability: number;
  risk_level: string;
  risk_color: string;
  ever_fought: boolean;
  same_region: boolean;
  both_nuclear: boolean;
  year: number;
}

export default function RivalriesPage() {
  const [rivalries, setRivalries] = useState<Rivalry[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(2025);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/rivalries?year=${year}`)
      .then(r => r.json())
      .then(data => { setRivalries(data); setLoading(false); });
  }, [year]);

  const filtered = rivalries.filter(r => {
    if (filter === 'CRITICAL') return r.conflict_probability >= 70;
    if (filter === 'HIGH') return r.conflict_probability >= 50;
    if (filter === 'MODERATE') return r.conflict_probability >= 30;
    if (filter === 'NUCLEAR') return r.both_nuclear;
    if (filter === 'EVER_FOUGHT') return r.ever_fought;
    return r.conflict_probability > 0;
  });

  const topRisk = rivalries.length > 0 ? rivalries[0] : null;
  const criticalCount = rivalries.filter(r => r.conflict_probability >= 70).length;
  const nuclearCount = rivalries.filter(r => r.both_nuclear && r.conflict_probability > 0).length;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080808',
      color: '#e0e0e0',
      fontFamily: "'Courier New', monospace",
    }}>
      {/* Header */}
      <div style={{
        borderBottom: '1px solid #1a1a1a',
        padding: '20px 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#0a0a0a',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Link href="/" style={{
            color: '#666',
            textDecoration: 'none',
            fontSize: 12,
            letterSpacing: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>← BACK TO MONITOR</Link>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: '#444', letterSpacing: 4 }}>CLASSIFIED INTELLIGENCE</div>
          <div style={{ fontSize: 20, fontWeight: 'bold', letterSpacing: 3, color: '#ef4444' }}>
            ⚔ CONFLICT RIVALRIES
          </div>
        </div>
        <div style={{ fontSize: 11, color: '#444', letterSpacing: 2 }}>
          DYADIC MODEL v1.0
        </div>
      </div>

      <div style={{ padding: '30px 40px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 30 }}>
          {[
            { label: 'TOTAL PAIRS ANALYZED', value: rivalries.length, color: '#e0e0e0' },
            { label: 'CRITICAL RIVALRIES', value: criticalCount, color: '#ef4444' },
            { label: 'NUCLEAR PAIR CONFLICTS', value: nuclearCount, color: '#f97316' },
            { label: 'FORECAST YEAR', value: year, color: '#22c55e' },
          ].map((s, i) => (
            <div key={i} style={{
              background: '#0f0f0f',
              border: '1px solid #1a1a1a',
              padding: '20px',
              borderRadius: 4,
            }}>
              <div style={{ fontSize: 9, color: '#444', letterSpacing: 3, marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 'bold', color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Year Slider */}
        <div style={{
          background: '#0f0f0f',
          border: '1px solid #1a1a1a',
          borderRadius: 4,
          padding: '20px 30px',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 24,
        }}>
          <div style={{ fontSize: 10, color: '#444', letterSpacing: 3, whiteSpace: 'nowrap' }}>FORECAST YEAR</div>
          <input
            type="range" min={2025} max={2040} value={year}
            onChange={e => { setYear(Number(e.target.value)); setLoading(true); }}
            style={{ flex: 1, accentColor: '#ef4444' }}
          />
          <div style={{
            fontSize: 24, fontWeight: 'bold', color: '#ef4444',
            background: '#1a0000', padding: '4px 16px', borderRadius: 4,
            border: '1px solid #ef4444', minWidth: 80, textAlign: 'center',
          }}>{year}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[2025, 2028, 2030, 2035, 2040].map(y => (
              <button key={y} onClick={() => { setYear(y); setLoading(true); }} style={{
                background: year === y ? '#ef4444' : 'transparent',
                border: `1px solid ${year === y ? '#ef4444' : '#333'}`,
                color: year === y ? '#fff' : '#666',
                padding: '4px 10px', borderRadius: 4,
                fontSize: 11, cursor: 'pointer', letterSpacing: 1,
              }}>{y}</button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {['ALL', 'CRITICAL', 'HIGH', 'MODERATE', 'NUCLEAR', 'EVER_FOUGHT'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              background: filter === f ? '#ef4444' : 'transparent',
              border: `1px solid ${filter === f ? '#ef4444' : '#222'}`,
              color: filter === f ? '#fff' : '#666',
              padding: '6px 14px', borderRadius: 4,
              fontSize: 10, cursor: 'pointer', letterSpacing: 2,
            }}>{f.replace('_', ' ')}</button>
          ))}
          <div style={{ marginLeft: 'auto', fontSize: 11, color: '#444', alignSelf: 'center' }}>
            {filtered.length} PAIRS
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#333', letterSpacing: 4 }}>
            LOADING INTELLIGENCE...
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 12 }}>
            {filtered.map((r, i) => (
              <Link
                key={i}
                href={`/rivalries/${r.country_a}/${r.country_b}`}
                style={{ textDecoration: 'none' }}
              >
                <div style={{
                  background: '#0f0f0f',
                  border: `1px solid ${r.conflict_probability >= 50 ? r.risk_color + '44' : '#1a1a1a'}`,
                  borderRadius: 4,
                  padding: '16px 20px',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  {/* Rank */}
                  <div style={{
                    position: 'absolute', top: 12, right: 14,
                    fontSize: 10, color: '#333', letterSpacing: 2,
                  }}>#{i + 1}</div>

                  {/* Countries */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 24 }}>{r.flag_a}</div>
                      <div style={{ fontSize: 9, color: '#666', letterSpacing: 1, marginTop: 2 }}>{r.country_a}</div>
                    </div>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ fontSize: 16, color: r.risk_color }}>⚔</div>
                      <div style={{
                        height: 2,
                        background: `linear-gradient(90deg, transparent, ${r.risk_color}, transparent)`,
                        margin: '4px 0',
                        opacity: r.conflict_probability / 100,
                      }} />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 24 }}>{r.flag_b}</div>
                      <div style={{ fontSize: 9, color: '#666', letterSpacing: 1, marginTop: 2 }}>{r.country_b}</div>
                    </div>
                    <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                      <div style={{ fontSize: 22, fontWeight: 'bold', color: r.risk_color }}>
                        {r.conflict_probability}%
                      </div>
                      <div style={{
                        fontSize: 9, letterSpacing: 2,
                        color: r.risk_color, marginTop: 2,
                      }}>{r.risk_level}</div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    {r.ever_fought && (
                      <span style={{
                        fontSize: 8, padding: '2px 8px',
                        background: '#1a0000', color: '#ef4444',
                        border: '1px solid #ef444433', borderRadius: 2, letterSpacing: 1,
                      }}>HISTORICAL CONFLICT</span>
                    )}
                    {r.both_nuclear && (
                      <span style={{
                        fontSize: 8, padding: '2px 8px',
                        background: '#1a0a00', color: '#f97316',
                        border: '1px solid #f9731633', borderRadius: 2, letterSpacing: 1,
                      }}>☢ BOTH NUCLEAR</span>
                    )}
                    {r.same_region && (
                      <span style={{
                        fontSize: 8, padding: '2px 8px',
                        background: '#0a0a1a', color: '#6366f1',
                        border: '1px solid #6366f133', borderRadius: 2, letterSpacing: 1,
                      }}>SAME REGION</span>
                    )}
                  </div>

                  {/* Probability bar */}
                  <div style={{
                    marginTop: 12,
                    height: 3,
                    background: '#1a1a1a',
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${r.conflict_probability}%`,
                      background: r.risk_color,
                      borderRadius: 2,
                    }} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
