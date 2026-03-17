'use client'
import { useEffect, useState } from 'react'
import { Match } from '@/lib/supabase'
import { getTopOpponents } from '@/lib/stats'

export default function RivalriesPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/matches').then(r => r.json()).then(data => { setMatches(data); setLoading(false) })
  }, [])

  const rivals = getTopOpponents(matches, 2)
  const opponentMatches = selected
    ? matches.filter(m => m.opponent === selected).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : []

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading...</div>

  return (
    <div style={{ paddingTop: 8 }}>
      <div style={{ marginBottom: 24 }}>
        <p className="label" style={{ marginBottom: 4 }}>Head-to-Head</p>
        <h1 className="heading-1">Rivalries</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: 4 }}>{rivals.length} opponents faced 2+ times</p>
      </div>

      {/* If opponent selected, show detail view on mobile (full screen) */}
      {selected ? (
        <div>
          <button onClick={() => setSelected(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gold)', fontSize: '0.875rem', fontWeight: 600, marginBottom: 16, padding: 0 }}>
            ← All Opponents
          </button>
          <div className="card" style={{ marginBottom: 16 }}>
            <p className="label" style={{ marginBottom: 2 }}>vs</p>
            <p style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: 4 }}>{selected}</p>
            <div style={{ display: 'flex', gap: 16 }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--win)' }}>{opponentMatches.filter(m => m.result === 'Win').length}</span>
              <span style={{ fontSize: '1.5rem', color: 'var(--border-strong)' }}>–</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--loss)' }}>{opponentMatches.filter(m => m.result === 'Loss').length}</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {opponentMatches.map((m, i) => (
              <div key={i} className="card-sm" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span className={`badge ${m.result === 'Win' ? 'badge-win' : 'badge-loss'}`} style={{ marginTop: 2, flexShrink: 0 }}>{m.result}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.tournament}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {m.method} · {m.belt} · {m.gi_nogi}{m.score ? ` · ${m.score}` : ''}
                  </p>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                  {new Date(m.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Opponent list */
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {rivals.map(r => (
            <button key={r.opponent} onClick={() => setSelected(r.opponent)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
              background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)',
              cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.opponent}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{r.total} matches</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1rem', color: 'var(--win)' }}>{r.wins}</span>
                  <span style={{ color: 'var(--border-strong)' }}>–</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1rem', color: 'var(--loss)' }}>{r.losses}</span>
                </div>
                <span className={`badge ${r.wins > r.losses ? 'badge-win' : r.losses > r.wins ? 'badge-loss' : ''}`}
                  style={{ minWidth: 28, textAlign: 'center', background: r.wins === r.losses ? 'var(--surface-2)' : undefined, color: r.wins === r.losses ? 'var(--text-muted)' : undefined }}>
                  {r.wins > r.losses ? 'W' : r.losses > r.wins ? 'L' : 'T'}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>›</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
