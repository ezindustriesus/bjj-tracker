'use client'
import { useEffect, useState, useMemo } from 'react'
import { Match } from '@/lib/supabase'
import { ChevronDown, ChevronUp } from 'lucide-react'

type TGroup = {
  name: string
  date: string
  organization: string
  matches: Match[]
  wins: number
  losses: number
  medals: string[]
}

function medalEmoji(m: string) {
  if (m === 'Gold') return '🥇'
  if (m === 'Silver') return '🥈'
  if (m === 'Bronze') return '🥉'
  return ''
}

export default function TournamentsPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    fetch('/api/matches').then(r => r.json()).then(d => { setMatches(d); setLoading(false) })
  }, [])

  const tournaments = useMemo(() => {
    const map = new Map<string, TGroup>()
    matches.forEach(m => {
      const key = m.tournament
      if (!map.has(key)) {
        map.set(key, { name: m.tournament, date: m.date, organization: m.organization, matches: [], wins: 0, losses: 0, medals: [] })
      }
      const t = map.get(key)!
      t.matches.push(m)
      if (m.result === 'Win') t.wins++
      else t.losses++
      if (m.date < t.date) t.date = m.date
    })

    // Collect unique medals per division
    map.forEach(t => {
      const divMedals = new Map<string, string>()
      t.matches.forEach(m => {
        if (!m.medal || !['Gold','Silver','Bronze'].includes(m.medal)) return
        const key = `${m.belt}|${m.age_division}|${m.weight_class}|${m.gi_nogi}|${m.division_type}`
        if (!divMedals.has(key)) divMedals.set(key, m.medal)
      })
      t.medals = Array.from(divMedals.values())
    })

    return Array.from(map.values())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .filter(t => !filter || t.name.toLowerCase().includes(filter.toLowerCase()) || t.organization.toLowerCase().includes(filter.toLowerCase()))
  }, [matches, filter])

  const totalGold = tournaments.reduce((n, t) => n + t.medals.filter(m => m === 'Gold').length, 0)
  const totalSilver = tournaments.reduce((n, t) => n + t.medals.filter(m => m === 'Silver').length, 0)

  return (
    <div style={{ paddingTop: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p className="label" style={{ marginBottom: 4 }}>Competition History</p>
          <h1 className="heading-1">Tournaments</h1>
        </div>
        {!loading && (
          <div style={{ display: 'flex', gap: 16, fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>{tournaments.length} events</span>
            <span>🥇 {totalGold}</span>
            <span>🥈 {totalSilver}</span>
          </div>
        )}
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <input
          placeholder="Search tournament or organization..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          style={{ width: '100%', background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 14px', fontSize: '0.875rem', color: 'var(--text-primary)', outline: 'none', fontFamily: 'var(--font-sans)' }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tournaments.map(t => {
            const isOpen = expanded === t.name
            const winRate = t.wins + t.losses > 0 ? Math.round(t.wins / (t.wins + t.losses) * 100) : 0
            const methodCounts = t.matches.reduce((acc, m) => { if (m.method) acc[m.method] = (acc[m.method]||0)+1; return acc }, {} as Record<string,number>)
            const topMethods = Object.entries(methodCounts).sort((a,b)=>b[1]-a[1]).slice(0,4)

            return (
              <div key={t.name} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {/* Header row */}
                <div
                  onClick={() => setExpanded(isOpen ? null : t.name)}
                  style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* Date */}
                  <div style={{ flexShrink: 0, textAlign: 'center', width: 44 }}>
                    <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      {new Date(t.date).toLocaleDateString('en-US', { month: 'short' })}
                    </p>
                    <p style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', lineHeight: 1 }}>
                      {new Date(t.date).getFullYear().toString().slice(2)}
                    </p>
                  </div>

                  <div style={{ width: 1, height: 32, background: 'var(--border)', flexShrink: 0 }} />

                  {/* Name + org */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 1 }}>{t.organization} · {t.matches.length} matches</p>
                  </div>

                  {/* Record */}
                  <div style={{ flexShrink: 0, textAlign: 'center' }}>
                    <p style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.1rem', color: winRate >= 60 ? 'var(--win)' : 'var(--loss)', lineHeight: 1 }}>{t.wins}–{t.losses}</p>
                    <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: 2 }}>{winRate}%</p>
                  </div>

                  {/* Medals */}
                  {t.medals.length > 0 && (
                    <div style={{ flexShrink: 0, display: 'flex', gap: 2 }}>
                      {t.medals.map((m, i) => <span key={i} style={{ fontSize: '1.1rem' }}>{medalEmoji(m)}</span>)}
                    </div>
                  )}

                  {isOpen ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                </div>

                {/* Expanded match list */}
                {isOpen && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '16px 20px' }}>
                    {/* Stats row */}
                    <div style={{ display: 'flex', gap: 24, marginBottom: 16, flexWrap: 'wrap' }}>
                      <div>
                        <p className="label" style={{ marginBottom: 2 }}>Methods</p>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{topMethods.map(([m,c]) => `${m} (${c})`).join(', ')}</p>
                      </div>
                      <div>
                        <p className="label" style={{ marginBottom: 2 }}>Divisions</p>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                          {[...new Set(t.matches.map(m => m.gi_nogi))].join(' · ')} · {[...new Set(t.matches.map(m => m.belt))].join('/')} belt
                        </p>
                      </div>
                    </div>

                    {/* Match rows */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {t.matches.map((m, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--bg)', borderRadius: 8 }}>
                          <span className={`badge ${m.result === 'Win' ? 'badge-win' : 'badge-loss'}`}>{m.result === 'Win' ? 'W' : 'L'}</span>
                          <span style={{ flex: 1, fontWeight: 500, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.opponent === 'Unknown' ? '—' : m.opponent}</span>
                          <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{m.method}</span>
                          {m.score && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{m.score}</span>}
                          <span className={`badge ${m.gi_nogi === 'Gi' ? 'badge-gi' : m.gi_nogi === 'No Gi' ? 'badge-nogi' : 'badge-suit'}`} style={{ fontSize: '0.625rem' }}>{m.gi_nogi}</span>
                          {m.medal && ['Gold','Silver','Bronze'].includes(m.medal) && <span>{medalEmoji(m.medal)}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
