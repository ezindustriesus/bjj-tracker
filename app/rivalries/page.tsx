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

  return (
    <div style={{ paddingTop: 8 }}>
      <div style={{ marginBottom: 24 }}>
        <p className="label" style={{ marginBottom: 4 }}>Head-to-Head</p>
        <h1 className="heading-1">Rivalries</h1>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* List */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)' }}>
              <p className="heading-2">Repeat Opponents</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>{rivals.length} opponents faced 2+ times</p>
            </div>
            <div style={{ overflowY: 'auto', maxHeight: 520 }}>
              {rivals.map(r => (
                <button key={r.opponent} onClick={() => setSelected(selected === r.opponent ? null : r.opponent)} style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 24px',
                  background: selected === r.opponent ? 'var(--gold-light)' : 'transparent',
                  border: 'none',
                  borderBottom: '1px solid var(--border)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.opponent}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{r.total} matches</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.9rem', color: 'var(--win)' }}>{r.wins}</span>
                    <span style={{ color: 'var(--border-strong)', fontSize: '0.875rem' }}>–</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.9rem', color: 'var(--loss)' }}>{r.losses}</span>
                  </div>
                  <span className={`badge ${r.wins > r.losses ? 'badge-win' : r.losses > r.wins ? 'badge-loss' : ''}`} style={{ background: r.wins === r.losses ? 'var(--surface-2)' : undefined, color: r.wins === r.losses ? 'var(--text-muted)' : undefined, fontSize: '0.6875rem', minWidth: 30, textAlign: 'center' }}>
                    {r.wins > r.losses ? 'W' : r.losses > r.wins ? 'L' : 'T'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Detail */}
          <div className="card">
            {selected ? (
              <>
                <div style={{ marginBottom: 20 }}>
                  <p className="label" style={{ marginBottom: 2 }}>vs</p>
                  <p className="heading-2">{selected}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    {opponentMatches.filter(m => m.result === 'Win').length} wins · {opponentMatches.filter(m => m.result === 'Loss').length} losses
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {opponentMatches.map((m, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 14px', background: 'var(--bg)', borderRadius: 10, alignItems: 'flex-start' }}>
                      <span className={`badge ${m.result === 'Win' ? 'badge-win' : 'badge-loss'}`} style={{ marginTop: 1, flexShrink: 0 }}>{m.result}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.tournament}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 3 }}>
                          {m.method} · {m.belt} · {m.gi_nogi}
                          {m.score && ` · ${m.score}`}
                        </p>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                        {new Date(m.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--text-muted)' }}>
                <span style={{ fontSize: 40, marginBottom: 12 }}>👥</span>
                <p style={{ fontSize: '0.9rem' }}>Select an opponent</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
