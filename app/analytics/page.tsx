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
    fetch(`/api/matches?${params}`)
      .then(r => r.json())
      .then(data => { setMatches(data); setLoading(false) })
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

  const sel: React.CSSProperties = {
    background: '#fff',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: '0.875rem',
    color: 'var(--text-primary)',
    outline: 'none',
    cursor: 'pointer',
    width: '100%',
  }

  return (
    <div style={{ paddingTop: 8 }}>
      <div style={{ marginBottom: 24 }}>
        <p className="label" style={{ marginBottom: 4 }}>Performance</p>
        <h1 className="heading-1">Analytics</h1>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, alignItems: 'end' }}>
          <div>
            <p className="label" style={{ marginBottom: 6 }}>Belt</p>
            <select style={sel} value={filters.belt} onChange={e => setFilters(f => ({...f, belt: e.target.value}))}>
              <option value="">All Belts</option>
              {['White','Blue','Purple'].map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <p className="label" style={{ marginBottom: 6 }}>Type</p>
            <select style={sel} value={filters.gi_nogi} onChange={e => setFilters(f => ({...f, gi_nogi: e.target.value}))}>
              <option value="">All Types</option>
              <option value="Gi">Gi</option>
              <option value="No Gi">No Gi</option>
              <option value="Suit">Suit</option>
            </select>
          </div>
          <div>
            <p className="label" style={{ marginBottom: 6 }}>Year</p>
            <select style={sel} value={filters.year} onChange={e => setFilters(f => ({...f, year: e.target.value}))}>
              <option value="">All Years</option>
              {[2026,2025,2024,2023,2022,2019].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <p className="label" style={{ marginBottom: 6 }}>Organization</p>
            <select style={sel} value={filters.organization} onChange={e => setFilters(f => ({...f, organization: e.target.value}))}>
              <option value="">All Orgs</option>
              {['AGF','IBJJF','Springfield BJJ','Newbreed','Chewjitsu','Grappling Industries','Fuji BJJ','JJ Outlet'].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          {hasFilters && (
            <div>
              <button onClick={() => setFilters({ belt:'', gi_nogi:'', year:'', organization:'' })} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: '0.875rem', cursor: 'pointer', color: 'var(--text-secondary)', width: '100%' }}>
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading...</div>
      ) : (
        <>
          {/* Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Record', value: `${record.wins}–${record.losses}`, sub: `${record.winRate}% win rate` },
              { label: 'Matches', value: record.total, sub: 'in filtered set' },
              { label: 'Sub Rate', value: `${subRate}%`, sub: 'wins by submission' },
              { label: 'Tournaments', value: new Set(matches.map(m => m.tournament)).size, sub: 'unique events' },
            ].map(s => (
              <div key={s.label} className="card-sm">
                <p className="label" style={{ marginBottom: 8 }}>{s.label}</p>
                <p style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.03em', fontFamily: 'var(--font-mono)', lineHeight: 1, marginBottom: 4 }}>{s.value}</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.sub}</p>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            {/* Year chart */}
            {byYear.length > 0 && (
              <div className="card">
                <p className="heading-2" style={{ marginBottom: 20 }}>Wins by Year</p>
                <WinRateChart data={byYear} />
              </div>
            )}

            {/* Gi breakdown */}
            <div className="card">
              <p className="heading-2" style={{ marginBottom: 20 }}>Gi / No Gi / Suit</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {byGiNogi.map(g => (
                  <div key={g.type}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{g.type}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{g.wins}–{g.losses} <span style={{ color: g.winRate >= 65 ? 'var(--win)' : 'var(--text-muted)' }}>({g.winRate}%)</span></span>
                    </div>
                    <div style={{ height: 6, background: 'var(--surface-2)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${g.winRate}%`, background: '#1a7a4a', borderRadius: 99, transition: 'width 0.4s ease' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Finish methods */}
          <div className="card">
            <p className="heading-2" style={{ marginBottom: 20 }}>Finish Methods</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {topMethods.map(([method, count]) => (
                <div key={method} style={{ display: 'grid', gridTemplateColumns: '150px 1fr 40px', gap: 12, alignItems: 'center' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{method}</span>
                  <div style={{ height: 6, background: 'var(--surface-2)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(count / maxMethod) * 100}%`, background: 'var(--gold)', borderRadius: 99, transition: 'width 0.4s ease' }} />
                  </div>
                  <span style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textAlign: 'right' }}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
