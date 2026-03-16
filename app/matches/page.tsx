'use client'
import { useEffect, useState, useCallback } from 'react'
import { Match } from '@/lib/supabase'
import EditMatchModal from '@/components/EditMatchModal'

const BELTS = ['White', 'Blue', 'Purple']
const YEARS = [2026, 2025, 2024, 2023, 2022, 2019]
const ORGS = ['AGF', 'IBJJF', 'Springfield BJJ', 'Newbreed', 'Chewjitsu', 'Grappling Industries', 'Fuji BJJ', 'JJ Outlet']

function giClass(gi: string) {
  if (gi === 'Gi') return 'badge badge-gi'
  if (gi === 'No Gi') return 'badge badge-nogi'
  return 'badge badge-suit'
}
function medalEmoji(m: string | null | undefined) {
  if (m === 'Gold') return '🥇'
  if (m === 'Silver') return '🥈'
  if (m === 'Bronze') return '🥉'
  return null
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ belt: '', gi_nogi: '', year: '', organization: '', result: '', search: '' })
  const [editing, setEditing] = useState<Match | null>(null)
  const [deleting, setDeleting] = useState<number | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filters.belt) params.set('belt', filters.belt)
    if (filters.gi_nogi) params.set('gi_nogi', filters.gi_nogi)
    if (filters.year) params.set('year', filters.year)
    if (filters.organization) params.set('organization', filters.organization)
    fetch(`/api/matches?${params}`)
      .then(r => r.json())
      .then(data => { setMatches(data); setLoading(false) })
  }, [filters.belt, filters.gi_nogi, filters.year, filters.organization])

  useEffect(() => { load() }, [load])

  const filtered = matches.filter(m => {
    if (filters.result && m.result !== filters.result) return false
    if (filters.search) {
      const q = filters.search.toLowerCase()
      return (m.opponent?.toLowerCase().includes(q) || m.tournament?.toLowerCase().includes(q) || m.method?.toLowerCase().includes(q)) ?? false
    }
    return true
  })

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this match? This cannot be undone.')) return
    setDeleting(id)
    await fetch(`/api/matches/${id}`, { method: 'DELETE' })
    setMatches(prev => prev.filter(m => m.id !== id))
    setDeleting(null)
  }

  const handleSave = (updated: Match) => {
    setMatches(prev => prev.map(m => m.id === updated.id ? updated : m))
    setEditing(null)
  }

  const sel: React.CSSProperties = { background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 10px', fontSize: '0.8125rem', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer' }
  const wins = filtered.filter(m => m.result === 'Win').length
  const losses = filtered.filter(m => m.result === 'Loss').length
  const hasFilters = Object.values(filters).some(Boolean)

  return (
    <div style={{ paddingTop: 8 }}>
      <div style={{ marginBottom: 24 }}>
        <p className="label" style={{ marginBottom: 4 }}>History</p>
        <h1 className="heading-1">All Matches</h1>
      </div>

      <div className="card" style={{ marginBottom: 16, padding: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          <input placeholder="Search opponent, tournament, method…" value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            style={{ ...sel, minWidth: 220, flex: 1 }} />
          <select style={sel} value={filters.result} onChange={e => setFilters(f => ({ ...f, result: e.target.value }))}>
            <option value="">W &amp; L</option>
            <option value="Win">Wins only</option>
            <option value="Loss">Losses only</option>
          </select>
          <select style={sel} value={filters.belt} onChange={e => setFilters(f => ({ ...f, belt: e.target.value }))}>
            <option value="">All Belts</option>
            {BELTS.map(b => <option key={b}>{b}</option>)}
          </select>
          <select style={sel} value={filters.gi_nogi} onChange={e => setFilters(f => ({ ...f, gi_nogi: e.target.value }))}>
            <option value="">All Types</option>
            <option value="Gi">Gi</option><option value="No Gi">No Gi</option><option value="Suit">Suit</option>
          </select>
          <select style={sel} value={filters.year} onChange={e => setFilters(f => ({ ...f, year: e.target.value }))}>
            <option value="">All Years</option>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select style={sel} value={filters.organization} onChange={e => setFilters(f => ({ ...f, organization: e.target.value }))}>
            <option value="">All Orgs</option>
            {ORGS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          {hasFilters && (
            <button onClick={() => setFilters({ belt: '', gi_nogi: '', year: '', organization: '', result: '', search: '' })}
              style={{ ...sel, color: 'var(--text-muted)', background: 'var(--surface-2)' }}>Clear</button>
          )}
        </div>
        {!loading && (
          <div style={{ marginTop: 10, display: 'flex', gap: 16, fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>{filtered.length} matches</span>
            <span style={{ color: 'var(--win)', fontWeight: 600 }}>{wins}W</span>
            <span style={{ color: 'var(--loss)', fontWeight: 600 }}>{losses}L</span>
            {wins + losses > 0 && <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{Math.round((wins / (wins + losses)) * 100)}%</span>}
          </div>
        )}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr 130px 100px 80px 90px 56px', gap: 8, padding: '10px 20px', borderBottom: '2px solid var(--border)', background: 'var(--surface-2)' }}>
          {['Result', 'Opponent / Tournament', 'Method', 'Division', 'Belt', 'Date', ''].map(h => (
            <p key={h} className="label" style={{ fontSize: '0.6rem' }}>{h}</p>
          ))}
        </div>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>No matches found</div>
        ) : (
          <div style={{ overflowY: 'auto', maxHeight: 640 }}>
            {filtered.map((m, i) => (
              <div key={m.id} style={{ display: 'grid', gridTemplateColumns: '70px 1fr 130px 100px 80px 90px 56px', gap: 8, padding: '11px 20px', borderBottom: '1px solid var(--border)', alignItems: 'center', background: i % 2 === 0 ? 'var(--surface)' : '#fdfcfb' }}>
                <span className={`badge ${m.result === 'Win' ? 'badge-win' : 'badge-loss'}`} style={{ width: 'fit-content', fontSize: '0.6875rem' }}>{m.result}</span>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {m.opponent === 'Unknown' ? '—' : m.opponent}
                    {medalEmoji(m.medal) && <span style={{ marginLeft: 5 }}>{medalEmoji(m.medal)}</span>}
                    {m.score && <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: 6 }}>{m.score}</span>}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>{m.tournament}</p>
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.method || '—'}</p>
                <span className={giClass(m.gi_nogi || '')} style={{ width: 'fit-content', fontSize: '0.6875rem' }}>{m.gi_nogi}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: m.belt === 'Purple' ? '#8b5cf6' : m.belt === 'Blue' ? '#3b7dd8' : '#e0ddd8', border: m.belt === 'White' ? '1.5px solid #ccc' : 'none', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{m.belt}</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                  {new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                </p>
                <div style={{ display: 'flex', gap: 2 }}>
                  <button onClick={() => setEditing(m)} title="Edit" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: 4, fontSize: 13 }}>✏️</button>
                  <button onClick={() => handleDelete(m.id!)} disabled={deleting === m.id} title="Delete" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: 4, fontSize: 13, opacity: deleting === m.id ? 0.4 : 1 }}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {editing && <EditMatchModal match={editing} onSave={handleSave} onClose={() => setEditing(null)} />}
    </div>
  )
}
