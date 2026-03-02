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
  has_scenarios: boolean;
}

interface Scenario {
  name: string;
  probability: number;
  probability_pct: string;
  historical_basis: string;
  escalation_risk: string;
  nuclear_risk: string;
}

interface ScenarioData {
  country_a: string;
  country_b: string;
  year: number;
  ml_conflict_probability: number;
  conflict_years_in_history: number;
  territory_dispute: string;
  incompatibility_type: string;
  last_historical_conflict: number;
  both_nuclear: boolean;
  key_facts: string[];
  scenarios: Scenario[];
}

export default function PairPage({ params }: { params: Promise<{ pair: string[] }> }) {
  const { pair } = use(params);
  const countryA = decodeURIComponent(pair[0]);
  const countryB = decodeURIComponent(pair[1]);
  const [data, setData] = useState<PairForecast | null>(null);
  const [scenarios, setScenarios] = useState<ScenarioData | null>(null);
  const [selectedYear, setSelectedYear] = useState(2025);
  const [activeTab, setActiveTab] = useState<'overview' | 'scenarios' | 'breakdown'>('overview');

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/rivalries/pair/${encodeURIComponent(countryA)}/${encodeURIComponent(countryB)}`)
      .then(r => r.json())
      .then(setData);
  }, [countryA, countryB]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/scenarios/${encodeURIComponent(countryA)}/${encodeURIComponent(countryB)}/${selectedYear}`)
      .then(r => r.json())
      .then(d => { if (!d.error) setScenarios(d); else setScenarios(null); });
  }, [countryA, countryB, selectedYear]);

  const getRiskColor = (p: number) => {
    if (p >= 70) return '#ef4444';
    if (p >= 50) return '#f97316';
    if (p >= 30) return '#eab308';
    return '#22c55e';
  };

  const getEscColor = (risk: string) => {
    if (risk === 'CRITICAL') return '#ef4444';
    if (risk === 'HIGH') return '#f97316';
    if (risk === 'MODERATE') return '#eab308';
    return '#22c55e';
  };

  if (!data) return (
    <div style={{ minHeight: '100vh', background: '#080808', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333', fontFamily: 'Courier New', letterSpacing: 4 }}>
      LOADING INTELLIGENCE...
    </div>
  );

  const color = getRiskColor(data.current_probability);
  const peak = Math.max(...data.forecast.map(f => f.probability));
  const peakYear = data.forecast.find(f => f.probability === peak)?.year;
  const outlook2040 = data.forecast[data.forecast.length - 1]?.probability || 0;

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#e0e0e0', fontFamily: "'Courier New', monospace" }}>
      <div style={{ borderBottom: '1px solid #1a1a1a', padding: '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0a0a0a' }}>
        <Link href="/rivalries" style={{ color: '#666', textDecoration: 'none', fontSize: 11, letterSpacing: 2 }}>← BACK TO RIVALRIES</Link>
        <div style={{ fontSize: 9, color: '#333', letterSpacing: 4 }}>ML-POWERED CONFLICT INTELLIGENCE • UCDP + PRIO DATA</div>
        <div style={{ fontSize: 9, color: scenarios ? '#22c55e' : '#444', letterSpacing: 2 }}>
          {scenarios ? '● SCENARIO DATA LOADED' : '○ NO SCENARIO DATA'}
        </div>
      </div>

      <div style={{ padding: '30px 40px' }}>
        {/* Hero */}
        <div style={{ background: '#0f0f0f', border: `1px solid ${color}44`, borderRadius: 8, padding: '36px', marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at center, ${color}06 0%, transparent 70%)`, pointerEvents: 'none' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 48, marginBottom: 24 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 56 }}>{data.flag_a}</div>
              <div style={{ fontSize: 13, color: '#aaa', letterSpacing: 3, marginTop: 6 }}>{data.country_a}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, color }}>⚔</div>
              <div style={{ fontSize: 10, color: '#333', letterSpacing: 3, marginTop: 4 }}>VS</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 56 }}>{data.flag_b}</div>
              <div style={{ fontSize: 13, color: '#aaa', letterSpacing: 3, marginTop: 6 }}>{data.country_b}</div>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 64, fontWeight: 'bold', color, lineHeight: 1 }}>{data.current_probability}%</div>
            <div style={{ fontSize: 12, color, letterSpacing: 4, marginTop: 8 }}>{data.risk_level} CONFLICT PROBABILITY — 2025</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              { label: 'PEAK RISK', value: `${peak}%`, sub: `in ${peakYear}`, c: '#ef4444' },
              { label: '2040 OUTLOOK', value: `${outlook2040}%`, sub: 'long term', c: getRiskColor(outlook2040) },
              { label: 'CONFLICT HISTORY', value: scenarios ? `${scenarios.conflict_years_in_history} yrs` : '—', sub: 'UCDP documented', c: '#f97316' },
              { label: 'LAST CONFLICT', value: scenarios ? String(scenarios.last_historical_conflict) : '—', sub: scenarios?.both_nuclear ? '☢ both nuclear' : 'conventional', c: scenarios?.both_nuclear ? '#ef4444' : '#eab308' },
            ].map((s, i) => (
              <div key={i} style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 6, padding: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 8, color: '#444', letterSpacing: 3, marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontSize: 22, fontWeight: 'bold', color: s.c }}>{s.value}</div>
                <div style={{ fontSize: 9, color: '#555', marginTop: 3 }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Context bar */}
        {scenarios && (
          <div style={{ background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: 6, padding: '12px 20px', marginBottom: 20, display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap' }}>
            <div><span style={{ fontSize: 8, color: '#444', letterSpacing: 2 }}>DISPUTE OVER </span><span style={{ fontSize: 11, color: '#f97316' }}>{scenarios.territory_dispute}</span></div>
            <div><span style={{ fontSize: 8, color: '#444', letterSpacing: 2 }}>TYPE </span><span style={{ fontSize: 11, color: '#eab308' }}>{scenarios.incompatibility_type}</span></div>
            <div><span style={{ fontSize: 8, color: '#444', letterSpacing: 2 }}>NUCLEAR </span><span style={{ fontSize: 11, color: scenarios.both_nuclear ? '#ef4444' : '#22c55e' }}>{scenarios.both_nuclear ? '☢ BOTH ARMED' : 'NONE'}</span></div>
            <div style={{ marginLeft: 'auto', fontSize: 8, color: '#2a2a2a', letterSpacing: 2 }}>SOURCE: UCDP/PRIO DATASET v25.1</div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
          {/* Chart */}
          <div style={{ background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: 8, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontSize: 9, color: '#444', letterSpacing: 3 }}>FORECAST 2025–2040</div>
              <div style={{ fontSize: 9, color: '#555' }}>SELECTED: <span style={{ color }}>{selectedYear}</span></div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data.forecast} onClick={(e: any) => { if (e?.activeLabel) setSelectedYear(Number(e.activeLabel)); }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                <XAxis dataKey="year" stroke="#333" tick={{ fill: '#555', fontSize: 9 }} />
                <YAxis stroke="#333" tick={{ fill: '#555', fontSize: 9 }} domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} />
                <Tooltip contentStyle={{ background: '#111', border: `1px solid ${color}`, borderRadius: 4, fontFamily: 'Courier New', fontSize: 11 }} formatter={(value: number) => [`${value}%`, 'Probability']} labelFormatter={(l: any) => `${l} — click to load`} />
                <ReferenceLine y={50} stroke="#ef444433" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="probability" stroke={color} strokeWidth={2}
                  dot={(props: any) => {
                    const sel = props.payload.year === selectedYear;
                    return <circle key={props.key} cx={props.cx} cy={props.cy} r={sel ? 6 : 3} fill={sel ? '#fff' : color} stroke={color} strokeWidth={sel ? 2 : 0} />;
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
            <div style={{ marginTop: 8, fontSize: 9, color: '#333', textAlign: 'center', letterSpacing: 2 }}>↑ CLICK YEAR TO LOAD SCENARIOS</div>
          </div>

          {/* Key Facts */}
          <div style={{ background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 9, color: '#444', letterSpacing: 3, marginBottom: 14 }}>KEY INTELLIGENCE FACTS</div>
            {scenarios ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {scenarios.key_facts.map((fact, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 10px', background: '#0a0a0a', borderRadius: 4, borderLeft: `2px solid ${color}55` }}>
                    <span style={{ color, fontSize: 10, marginTop: 1, flexShrink: 0 }}>▶</span>
                    <span style={{ fontSize: 10, color: '#aaa', lineHeight: 1.6 }}>{fact}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 40, color: '#2a2a2a', fontSize: 10, letterSpacing: 3 }}>NO SCENARIO DATA FOR THIS PAIR</div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: 8, padding: 24 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 24, alignItems: 'center' }}>
            {[{ id: 'overview', label: '📊 OVERVIEW' }, { id: 'scenarios', label: '⚡ TRIGGER SCENARIOS' }, { id: 'breakdown', label: '📅 YEAR BREAKDOWN' }].map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id as any)} style={{ padding: '7px 16px', borderRadius: 4, fontSize: 10, letterSpacing: 2, cursor: 'pointer', background: activeTab === t.id ? color + '22' : 'transparent', border: `1px solid ${activeTab === t.id ? color : '#222'}`, color: activeTab === t.id ? color : '#555' }}>
                {t.label}
              </button>
            ))}
            {scenarios && (
              <div style={{ marginLeft: 'auto', fontSize: 9, color: '#333', letterSpacing: 1 }}>
                YEAR: <span style={{ color }}>{selectedYear}</span> • ML PROB: <span style={{ color }}>{scenarios.ml_conflict_probability}%</span>
              </div>
            )}
          </div>

          {/* OVERVIEW */}
          {activeTab === 'overview' && scenarios && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: '#0a0a0a', border: `1px solid ${color}22`, borderRadius: 6, padding: '18px 20px' }}>
                <div style={{ fontSize: 9, color: '#444', letterSpacing: 3, marginBottom: 10 }}>MOST LIKELY SCENARIO — {selectedYear}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 16, color: '#ddd', fontWeight: 'bold', marginBottom: 6 }}>{scenarios.scenarios[0]?.name}</div>
                    <div style={{ fontSize: 11, color: '#666', lineHeight: 1.7 }}>{scenarios.scenarios[0]?.historical_basis}</div>
                  </div>
                  <div style={{ textAlign: 'right', marginLeft: 24, flexShrink: 0 }}>
                    <div style={{ fontSize: 40, fontWeight: 'bold', color: getRiskColor(scenarios.scenarios[0]?.probability || 0) }}>{scenarios.scenarios[0]?.probability_pct}</div>
                    <div style={{ fontSize: 8, color: '#444', letterSpacing: 2 }}>LIKELIHOOD</div>
                  </div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                {scenarios.scenarios.map((s, i) => (
                  <div key={i} style={{ background: '#0a0a0a', border: `1px solid ${getRiskColor(s.probability)}22`, borderRadius: 6, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 10, color: '#bbb', fontWeight: 'bold' }}>{s.name}</span>
                      <span style={{ fontSize: 15, fontWeight: 'bold', color: getRiskColor(s.probability) }}>{s.probability_pct}</span>
                    </div>
                    <div style={{ height: 3, background: '#1a1a1a', borderRadius: 2, marginBottom: 8 }}>
                      <div style={{ height: '100%', width: `${Math.min(s.probability, 100)}%`, background: getRiskColor(s.probability), borderRadius: 2 }} />
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 8, padding: '2px 6px', background: getEscColor(s.escalation_risk) + '15', color: getEscColor(s.escalation_risk), borderRadius: 2 }}>ESC: {s.escalation_risk}</span>
                      <span style={{ fontSize: 8, padding: '2px 6px', background: '#1a000022', color: '#ef444488', borderRadius: 2 }}>☢ {s.nuclear_risk.split('—')[0].trim()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'overview' && !scenarios && (
            <div style={{ textAlign: 'center', padding: 60, color: '#2a2a2a' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
              <div style={{ fontSize: 10, letterSpacing: 3 }}>NO SCENARIO DATA FOR THIS PAIR YET</div>
            </div>
          )}

          {/* SCENARIOS */}
          {activeTab === 'scenarios' && scenarios && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: 9, color: '#444', letterSpacing: 3 }}>CONFLICT TRIGGER SCENARIOS — {selectedYear} — {scenarios.conflict_years_in_history} YRS HISTORICAL DATA</div>
              {scenarios.scenarios.map((s, i) => {
                const sc = getRiskColor(s.probability);
                return (
                  <div key={i} style={{ background: '#0a0a0a', border: `1px solid ${sc}33`, borderRadius: 6, padding: '20px 24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: sc + '15', border: `1px solid ${sc}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: sc, fontWeight: 'bold', flexShrink: 0 }}>{i + 1}</div>
                        <div>
                          <div style={{ fontSize: 14, color: '#ddd', fontWeight: 'bold' }}>{s.name}</div>
                          <div style={{ fontSize: 9, color: '#555', letterSpacing: 2, marginTop: 2 }}>TRIGGER SCENARIO</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 28, fontWeight: 'bold', color: sc }}>{s.probability_pct}</div>
                        <div style={{ fontSize: 8, color: '#444', letterSpacing: 2 }}>ML PROBABILITY</div>
                      </div>
                    </div>
                    <div style={{ height: 4, background: '#1a1a1a', borderRadius: 2, marginBottom: 14 }}>
                      <div style={{ height: '100%', width: `${Math.min(s.probability, 100)}%`, background: sc, borderRadius: 2 }} />
                    </div>
                    <div style={{ background: '#111', borderRadius: 4, padding: '10px 14px', marginBottom: 12 }}>
                      <div style={{ fontSize: 8, color: '#444', letterSpacing: 3, marginBottom: 5 }}>HISTORICAL BASIS</div>
                      <div style={{ fontSize: 11, color: '#888', lineHeight: 1.8 }}>{s.historical_basis}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <div style={{ flex: 1, background: getEscColor(s.escalation_risk) + '10', border: `1px solid ${getEscColor(s.escalation_risk)}22`, borderRadius: 4, padding: '8px 12px' }}>
                        <div style={{ fontSize: 8, color: '#444', letterSpacing: 2, marginBottom: 4 }}>ESCALATION RISK</div>
                        <div style={{ fontSize: 12, color: getEscColor(s.escalation_risk), fontWeight: 'bold' }}>{s.escalation_risk}</div>
                      </div>
                      <div style={{ flex: 2, background: '#0d0000', border: '1px solid #ef444422', borderRadius: 4, padding: '8px 12px' }}>
                        <div style={{ fontSize: 8, color: '#444', letterSpacing: 2, marginBottom: 4 }}>☢ NUCLEAR RISK</div>
                        <div style={{ fontSize: 11, color: '#ef444477' }}>{s.nuclear_risk}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'scenarios' && !scenarios && (
            <div style={{ textAlign: 'center', padding: 60, color: '#2a2a2a' }}>
              <div style={{ fontSize: 10, letterSpacing: 3 }}>NO SCENARIO DATA FOR THIS PAIR</div>
              <div style={{ fontSize: 9, color: '#1a1a1a', marginTop: 8 }}>COVERED: INDIA-PAKISTAN, IRAN-ISRAEL, CHINA-INDIA, AFGHANISTAN-PAKISTAN, IRAN-SAUDI ARABIA, RUSSIA-CHINA</div>
            </div>
          )}

          {/* BREAKDOWN */}
          {activeTab === 'breakdown' && (
            <div>
              <div style={{ fontSize: 9, color: '#444', letterSpacing: 3, marginBottom: 14 }}>CLICK A YEAR TO LOAD THAT YEAR'S SCENARIOS</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {data.forecast.map(f => (
                  <div key={f.year} onClick={() => { setSelectedYear(f.year); setActiveTab('scenarios'); }}
                    style={{ background: selectedYear === f.year ? getRiskColor(f.probability) + '15' : '#0a0a0a', border: `1px solid ${selectedYear === f.year ? getRiskColor(f.probability) : getRiskColor(f.probability) + '22'}`, borderLeft: `3px solid ${getRiskColor(f.probability)}`, borderRadius: 4, padding: '12px 16px', cursor: 'pointer' }}>
                    <div style={{ fontSize: 11, color: '#555' }}>{f.year}</div>
                    <div style={{ fontSize: 20, fontWeight: 'bold', color: getRiskColor(f.probability) }}>{f.probability}%</div>
                    <div style={{ fontSize: 8, color: '#333', marginTop: 2 }}>{f.probability >= 70 ? 'CRITICAL' : f.probability >= 50 ? 'HIGH' : f.probability >= 30 ? 'MODERATE' : 'LOW'}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}