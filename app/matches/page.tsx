'use client'
import { useEffect, useState, useMemo } from 'react'
import { Match } from '@/lib/supabase'
import EditMatchModal from '@/components/EditMatchModal'
import { Search } from 'lucide-react'

const PAGE_SIZE = 25

function medalEmoji(m: string | null | undefined) {
  if (m === 'Gold') return '🥇'
  if (m === 'Silver') return '🥈'
  if (m === 'Bronze') return '🥉'
  return null
}

export default function MatchesPage() {
  const [allMatches, setAllMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ result: '', belt: '', gi_nogi: '', year: '', organization: '' })
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<Match | null>(null)
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc')

  useEffect(() => {
    fetch('/api/matches')
      .then(r => r.json())
      .then(data => { setAllMatches(data); setLoading(false) })
  }, [])

  const filtered = useMemo(() => {
    let ms = [...allMatches]
    if (sortDir === 'asc') ms.reverse()

    const q = search.toLowerCase()
    if (q) ms = ms.filter(m =>
      m.opponent?.toLowerCase().includes(q) ||
      m.tournament?.toLowerCase().includes(q) ||
      m.method?.toLowerCase().includes(q) ||
      m.organization?.toLowerCase().includes(q)
    )
    if (filters.result) ms = ms.filter(m => m.result === filters.result)
    if (filters.belt) ms = ms.filter(m => m.belt === filters.belt)
    if (filters.gi_nogi) ms = ms.filter(m => m.gi_nogi === filters.gi_nogi)
    if (filters.organization) ms = ms.filter(m => m.organization === filters.organization)
    if (filters.year) ms = ms.filter(m => m.date?.startsWith(filters.year))
    return ms
  }, [allMatches, search, filters, sortDir])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const pageMatches = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => { setPage(1) }, [search, filters])

  const setFilter = (k: string, v: string) => setFilters(f => ({ ...f, [k]: v }))
  const hasFilters = search || Object.values(filters).some(Boolean)
  const clearAll = () => { setSearch(''); setFilters({ result: '', belt: '', gi_nogi: '', year: '', organization: '' }) }

  const wins = filtered.filter(m => m.result === 'Win').length
  const losses = filtered.filter(m => m.result === 'Loss').length

  const handleSaved = (updated: Match) => {
    setAllMatches(ms => ms.map(m => m.id === updated.id ? updated : m))
    setEditing(null)
  }
  const handleDeleted = (id: number) => {
    setAllMatches(ms => ms.filter(m => m.id !== id))
    setEditing(null)
  }

  const sel: React.CSSProperties = {
    background: '#fff', border: '1px solid var(--border)', borderRadius: 7,
    padding: '7px 10px', fontSize: '0.8125rem', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer',
  }

  return (
    <div style={{ paddingTop: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p className="label" style={{ marginBottom: 4 }}>History</p>
          <h1 className="heading-1">All Matches</h1>
        </div>
        {!loading && (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            {filtered.length} matches
            {filtered.length > 0 && <span style={{ marginLeft: 10, color: wins > losses ? 'var(--win)' : 'var(--text-secondary)' }}>
              {wins}W – {losses}L ({filtered.length > 0 ? Math.round(wins / filtered.length * 100) : 0}%)
            </span>}
          </p>
        )}
      </div>

      {/* Search + Filters */}
      <div className="card" style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            placeholder="Search opponent, tournament, method..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px 9px 36px', fontSize: '0.875rem', color: 'var(--text-primary)', outline: 'none', fontFamily: 'var(--font-sans)' }}
          />
        </div>

        {/* Filter row */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <select style={sel} value={filters.result} onChange={e => setFilter('result', e.target.value)}>
            <option value="">All Results</option>
            <option value="Win">Wins</option>
            <option value="Loss">Losses</option>
          </select>
          <select style={sel} value={filters.belt} onChange={e => setFilter('belt', e.target.value)}>
            <option value="">All Belts</option>
            {['White','Blue','Purple'].map(b => <option key={b}>{b}</option>)}
          </select>
          <select style={sel} value={filters.gi_nogi} onChange={e => setFilter('gi_nogi', e.target.value)}>
            <option value="">Gi / No Gi</option>
            <option value="Gi">Gi</option>
            <option value="No Gi">No Gi</option>
            <option value="Suit">Suit</option>
          </select>
          <select style={sel} value={filters.year} onChange={e => setFilter('year', e.target.value)}>
            <option value="">All Years</option>
            {[2026,2025,2024,2023,2022,2019].map(y => <option key={y} value={String(y)}>{y}</option>)}
          </select>
          <select style={sel} value={filters.organization} onChange={e => setFilter('organization', e.target.value)}>
            <option value="">All Orgs</option>
            {['AGF','IBJJF','Springfield BJJ','Newbreed','Chewjitsu','Grappling Industries','Fuji BJJ','JJ Outlet'].map(o => <option key={o} value={o}>{o}</option>)}
          </select>

          <button onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')} style={{ ...sel, display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
            {sortDir === 'desc' ? '↓ Newest' : '↑ Oldest'}
          </button>

          {hasFilters && (
            <button onClick={clearAll} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gold)', fontSize: '0.8125rem', fontWeight: 600, padding: '0 4px' }}>
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>No matches found</div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Date','Opponent','Tournament','Method','Score','Type','Belt','Medal',''].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageMatches.map((m, i) => (
                  <tr key={m.id} onClick={() => setEditing(m)} style={{
                    borderBottom: i < pageMatches.length - 1 ? '1px solid var(--border)' : 'none',
                    cursor: 'pointer',
                    transition: 'background 0.1s',
                    background: 'transparent',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                      {new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className={`badge ${m.result === 'Win' ? 'badge-win' : 'badge-loss'}`}>{m.result === 'Win' ? 'W' : 'L'}</span>
                        <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>{m.opponent === 'Unknown' ? '—' : m.opponent}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', maxWidth: 220 }}>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.tournament}</p>
                      <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: 1 }}>{m.organization}</p>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '0.8125rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{m.method || '—'}</td>
                    <td style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{m.score || '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className={`badge ${m.gi_nogi === 'Gi' ? 'badge-gi' : m.gi_nogi === 'No Gi' ? 'badge-nogi' : 'badge-suit'}`}>{m.gi_nogi}</span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{m.belt}</td>
                    <td style={{ padding: '12px 16px', fontSize: '0.875rem' }}>{medalEmoji(m.medal) || <span style={{ color: 'var(--border-strong)' }}>—</span>}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', opacity: 0.5 }}>✏️</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, padding: '16px', borderTop: '1px solid var(--border)' }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border)', background: '#fff', cursor: page === 1 ? 'default' : 'pointer', opacity: page === 1 ? 0.4 : 1, fontSize: '0.8125rem' }}>← Prev</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: p === page ? 'var(--gold)' : '#fff', color: p === page ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: p === page ? 700 : 400 }}>{p}</button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border)', background: '#fff', cursor: page === totalPages ? 'default' : 'pointer', opacity: page === totalPages ? 0.4 : 1, fontSize: '0.8125rem' }}>Next →</button>
            </div>
          )}
        </div>
      )}

      <EditMatchModal match={editing} onClose={() => setEditing(null)} onSaved={handleSaved} onDeleted={handleDeleted} />
    </div>
  )
}
