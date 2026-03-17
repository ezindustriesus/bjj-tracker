'use client'
import { useEffect, useState, useMemo } from 'react'
import { Match } from '@/lib/supabase'

type TournamentGroup = {
  name: string; date: string; organization: string
  matches: Match[]; wins: number; losses: number
  golds: number; silvers: number; bronzes: number
}

export default function TournamentsPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterYear, setFilterYear] = useState('')

  useEffect(() => {
    fetch('/api/matches').then(r => r.json()).then(d => { setMatches(d); setLoading(false) })
  }, [])

  const tournaments = useMemo(() => {
    const map = new Map<string, TournamentGroup>()
    matches.forEach(m => {
      if (!map.has(m.tournament)) map.set(m.tournament, { name: m.tournament, date: m.date, organization: m.organization, matches: [], wins: 0, losses: 0, golds: 0, silvers: 0, bronzes: 0 })
      const t = map.get(m.tournament)!
      t.matches.push(m)
      if (m.result === 'Win') t.wins++; else t.losses++
      if (m.date < t.date) t.date = m.date
    })
    map.forEach(t => {
      const divMedals = new Map<string, string>()
      t.matches.forEach(m => { if (m.medal) divMedals.set(`${m.belt}|${m.age_division}|${m.gi_nogi}|${m.division_type}`, m.medal) })
      const medals = Array.from(divMedals.values())
      t.golds = medals.filter(m => m === 'Gold').length
      t.silvers = medals.filter(m => m === 'Silver').length
      t.bronzes = medals.filter(m => m === 'Bronze').length
    })
    return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date))
  }, [matches])

  const filtered = useMemo(() => tournaments.filter(t => {
    if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !t.organization.toLowerCase().includes(search.toLowerCase())) return false
    if (filterYear && !t.date.startsWith(filterYear)) return false
    return true
  }), [tournaments, search, filterYear])

  const totalGold = tournaments.reduce((s, t) => s + t.golds, 0)
  const totalSilver = tournaments.reduce((s, t) => s + t.silvers, 0)

  return (
    <div style={{ paddingTop: 8 }}>
      <div style={{ marginBottom: 20 }}>
        <p className="label" style={{ marginBottom: 4 }}>Events</p>
        <h1 className="heading-1">Tournaments</h1>
        <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{tournaments.length} events</span>
          <span style={{ fontSize: '0.875rem' }}>🥇 {totalGold}</span>
          <span style={{ fontSize: '0.875rem' }}>🥈 {totalSilver}</span>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <input placeholder="Search tournament or org..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 180, background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px', fontSize: '0.875rem', outline: 'none' }} />
        <select value={filterYear} onChange={e => setFilterYear(e.target.value)}
          style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px', fontSize: '0.875rem', outline: 'none', cursor: 'pointer' }}>
          <option value="">All Years</option>
          {[2026,2025,2024,2023,2022,2019].map(y => <option key={y} value={String(y)}>{y}</option>)}
        </select>
        {(search || filterYear) && <button onClick={() => { setSearch(''); setFilterYear('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gold)', fontSize: '0.875rem', fontWeight: 600 }}>Clear</button>}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(t => {
            const isOpen = expanded === t.name
            const wr = t.wins + t.losses > 0 ? Math.round(t.wins / (t.wins + t.losses) * 100) : 0
            const d = new Date(t.date)
            return (
              <div key={t.name} className="card" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }} onClick={() => setExpanded(isOpen ? null : t.name)}>
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    {/* Date badge */}
                    <div style={{ minWidth: 44, textAlign: 'center', background: 'var(--bg)', borderRadius: 8, padding: '6px 4px', flexShrink: 0 }}>
                      <p style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                        {d.toLocaleDateString('en-US', { month: 'short' })}
                      </p>
                      <p style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', lineHeight: 1 }}>
                        {d.getFullYear().toString().slice(2)}
                      </p>
                    </div>

                    {/* Main info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)', wordBreak: 'break-word', lineHeight: 1.3, marginBottom: 3 }}>{t.name}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.organization} · {t.matches.length} matches</p>
                      {/* Medals inline */}
                      {(t.golds + t.silvers + t.bronzes) > 0 && (
                        <p style={{ fontSize: '0.875rem', marginTop: 4 }}>
                          {'🥇'.repeat(t.golds)}{'🥈'.repeat(t.silvers)}{'🥉'.repeat(t.bronzes)}
                        </p>
                      )}
                    </div>

                    {/* Record + chevron */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1rem', color: wr >= 60 ? 'var(--win)' : wr >= 40 ? 'var(--gold)' : 'var(--loss)' }}>{t.wins}–{t.losses}</p>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{wr}%</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>{isOpen ? '▲' : '▼'}</p>
                    </div>
                  </div>
                </div>

                {/* Expanded matches */}
                {isOpen && (
                  <div style={{ borderTop: '1px solid var(--border)' }}>
                    {(() => {
                      const divGroups = new Map<string, Match[]>()
                      t.matches.forEach(m => {
                        const key = `${m.gi_nogi} · ${m.age_division} · ${m.division_type}`
                        if (!divGroups.has(key)) divGroups.set(key, [])
                        divGroups.get(key)!.push(m)
                      })
                      return Array.from(divGroups.entries()).map(([div, ms]) => (
                        <div key={div} style={{ borderBottom: '1px solid var(--border)' }}>
                          <div style={{ padding: '8px 16px', background: 'var(--bg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{div}</p>
                            {ms[0]?.medal && <span style={{ fontSize: '0.875rem' }}>{ms[0].medal === 'Gold' ? '🥇' : ms[0].medal === 'Silver' ? '🥈' : ms[0].medal === 'Bronze' ? '🥉' : ms[0].medal}</span>}
                          </div>
                          {ms.map((m, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderTop: '1px solid var(--border)' }}>
                              <span className={`badge ${m.result === 'Win' ? 'badge-win' : 'badge-loss'}`}>{m.result === 'Win' ? 'W' : 'L'}</span>
                              <span style={{ flex: 1, fontSize: '0.875rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.opponent === 'Unknown' ? '—' : m.opponent}</span>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', flexShrink: 0 }}>{m.method}</span>
                              {m.score && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{m.score}</span>}
                            </div>
                          ))}
                        </div>
                      ))
                    })()}
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
