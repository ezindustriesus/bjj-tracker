'use client'
import { useEffect, useState } from 'react'
import { Match } from '@/lib/supabase'
import { calcOverallRecord, calcSubmissionRate, groupByYear, groupByGiNogi } from '@/lib/stats'
import WinRateChart from '@/components/WinRateChart'

export default function AnalyticsPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ belt: '', gi_nogi: '', year: '', organization: '' })

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v) })
    fetch(`/api/matches?${params}`).then(r => r.json()).then(data => { setMatches(data); setLoading(false) })
  }, [filters])

  const record = calcOverallRecord(matches)
  const subRate = calcSubmissionRate(matches)
  const byYear = groupByYear(matches)
  const byGiNogi = groupByGiNogi(matches)

  const methodCounts = matches.reduce((acc, m) => {
    if (m.method) acc[m.method] = (acc[m.method] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  const topMethods = Object.entries(methodCounts).sort((a, b) => b[1] - a[1]).slice(0, 10)
  const maxMethod = topMethods[0]?.[1] || 1

  const hasFilters = Object.values(filters).some(Boolean)
  const sel: React.CSSProperties = { background: '#fff', border: '1px solid var(--border)', borderRadius: 7, padding: '8px 10px', fontSize: '0.875rem', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer', width: '100%' }

  return (
    <div style={{ paddingTop: 8 }}>
      <div style={{ marginBottom: 20 }}>
        <p className="label" style={{ marginBottom: 4 }}>Performance</p>
        <h1 className="heading-1">Analytics</h1>
      </div>

      {/* Filters - stacked on mobile */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div><p className="label" style={{ marginBottom: 5 }}>Belt</p>
            <select style={sel} value={filters.belt} onChange={e => setFilters(f => ({...f, belt: e.target.value}))}>
              <option value="">All Belts</option>
              {['White','Blue','Purple'].map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div><p className="label" style={{ marginBottom: 5 }}>Type</p>
            <select style={sel} value={filters.gi_nogi} onChange={e => setFilters(f => ({...f, gi_nogi: e.target.value}))}>
              <option value="">All Types</option>
              <option value="Gi">Gi</option><option value="No Gi">No Gi</option><option value="Suit">Suit</option>
            </select>
          </div>
          <div><p className="label" style={{ marginBottom: 5 }}>Year</p>
            <select style={sel} value={filters.year} onChange={e => setFilters(f => ({...f, year: e.target.value}))}>
              <option value="">All Years</option>
              {[2026,2025,2024,2023,2022,2019].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div><p className="label" style={{ marginBottom: 5 }}>Org</p>
            <select style={sel} value={filters.organization} onChange={e => setFilters(f => ({...f, organization: e.target.value}))}>
              <option value="">All Orgs</option>
              {['AGF','IBJJF','Springfield BJJ','Newbreed','Chewjitsu'].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>
        {hasFilters && <button onClick={() => setFilters({ belt:'', gi_nogi:'', year:'', organization:'' })} style={{ marginTop: 10, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gold)', fontSize: '0.875rem', fontWeight: 600, padding: 0 }}>Clear filters</button>}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading...</div>
      ) : (
        <>
          {/* Summary - 2 col on mobile */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            {[
              { label: 'Record', value: `${record.wins}–${record.losses}`, sub: `${record.winRate}% win rate` },
              { label: 'Matches', value: record.total, sub: 'in filtered set' },
              { label: 'Sub Rate', value: `${subRate}%`, sub: 'wins by sub' },
              { label: 'Events', value: new Set(matches.map(m => m.tournament)).size, sub: 'tournaments' },
            ].map(s => (
              <div key={s.label} className="card-sm">
                <p className="label" style={{ marginBottom: 6 }}>{s.label}</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.03em', fontFamily: 'var(--font-mono)', lineHeight: 1, marginBottom: 3 }}>{s.value}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Year chart - full width */}
          {byYear.length > 0 && (
            <div className="card" style={{ marginBottom: 16 }}>
              <p className="heading-2" style={{ marginBottom: 6 }}>Wins by Year</p>
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8rem', color: 'var(--text-muted)' }}><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: '#1a7a4a' }} /> Wins</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8rem', color: 'var(--text-muted)' }}><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: '#e5ddd4' }} /> Losses</span>
              </div>
              <WinRateChart data={byYear} />
            </div>
          )}

          {/* Gi breakdown - full width */}
          <div className="card" style={{ marginBottom: 16 }}>
            <p className="heading-2" style={{ marginBottom: 16 }}>Gi / No Gi / Suit</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {byGiNogi.map(g => (
                <div key={g.type}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{g.type}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{g.wins}–{g.losses} <span style={{ color: g.winRate >= 65 ? 'var(--win)' : 'var(--text-muted)' }}>({g.winRate}%)</span></span>
                  </div>
                  <div style={{ height: 8, background: 'var(--surface-2)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${g.winRate}%`, background: '#1a7a4a', borderRadius: 99 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Finish methods - full width */}
          <div className="card">
            <p className="heading-2" style={{ marginBottom: 16 }}>Finish Methods</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {topMethods.map(([method, count]) => (
                <div key={method} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', minWidth: 120, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{method}</span>
                  <div style={{ flex: 1, height: 6, background: 'var(--surface-2)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(count / maxMethod) * 100}%`, background: 'var(--gold)', borderRadius: 99 }} />
                  </div>
                  <span style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', minWidth: 24, textAlign: 'right', flexShrink: 0 }}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
