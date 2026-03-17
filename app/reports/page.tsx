'use client'
import { useEffect, useState, useRef } from 'react'
import { Match } from '@/lib/supabase'
import { calcOverallRecord, calcSubmissionRate, calcMedalCounts, groupByBelt, groupByYear, getCurrentStreak, groupByGiNogi } from '@/lib/stats'

type CardType = 'career' | 'year' | 'belt' | 'streak' | 'ginogi'

export default function ReportsPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCard, setActiveCard] = useState<CardType>('career')
  const [selectedYear, setSelectedYear] = useState('2025')
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/matches').then(r => r.json()).then(d => { setMatches(d); setLoading(false) })
  }, [])

  const record = calcOverallRecord(matches)
  const subRate = calcSubmissionRate(matches)
  const medals = calcMedalCounts(matches)
  const streak = getCurrentStreak(matches)
  const byBelt = groupByBelt(matches)
  const byGiNogi = groupByGiNogi(matches)
  const yearMatches = matches.filter(m => m.date?.startsWith(selectedYear))
  const yearRecord = calcOverallRecord(yearMatches)
  const yearMedals = calcMedalCounts(yearMatches)

  const handleDownload = async () => {
    if (!cardRef.current) return
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(cardRef.current, { scale: 3, useCORS: true, backgroundColor: null })
      const a = document.createElement('a')
      a.download = `bjj-stats-${activeCard}.png`
      a.href = canvas.toDataURL('image/png')
      a.click()
    } catch {
      alert('Screenshot the card directly to save it.')
    }
  }

  const cardBtns: { type: CardType; label: string }[] = [
    { type: 'career', label: '🏆 Career Summary' },
    { type: 'year', label: '📅 Year Recap' },
    { type: 'belt', label: '🥋 Belt Journey' },
    { type: 'streak', label: '🔥 Current Streak' },
    { type: 'ginogi', label: '⚔️ Gi vs No Gi' },
  ]

  if (loading) return <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-muted)' }}>Loading...</div>

  return (
    <div style={{ paddingTop: 8 }}>
      <div style={{ marginBottom: 20 }}>
        <p className="label" style={{ marginBottom: 4 }}>Share</p>
        <h1 className="heading-1">Reports</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 4 }}>Shareable stat cards for Instagram & social media</p>
      </div>

      {/* Card type picker - horizontal scroll on mobile */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 16, WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
        {cardBtns.map(({ type, label }) => (
          <button key={type} onClick={() => setActiveCard(type)} style={{
            padding: '8px 14px', borderRadius: 8, border: `1.5px solid ${activeCard === type ? 'var(--gold)' : 'var(--border)'}`,
            background: activeCard === type ? 'var(--gold-light)' : '#fff', color: activeCard === type ? 'var(--gold)' : 'var(--text-secondary)',
            fontWeight: activeCard === type ? 700 : 500, fontSize: '0.8125rem', cursor: 'pointer', fontFamily: 'var(--font-sans)',
            whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.15s',
          }}>{label}</button>
        ))}
      </div>

      {activeCard === 'year' && (
        <div style={{ marginBottom: 12 }}>
          <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff', fontSize: '0.875rem', cursor: 'pointer', outline: 'none' }}>
            {[2026,2025,2024,2023,2022,2019].map(y => <option key={y} value={String(y)}>{y}</option>)}
          </select>
        </div>
      )}

      {/* Card preview - full width on mobile */}
      <div ref={cardRef} style={{ marginBottom: 16 }}>
        {activeCard === 'career' && <CareerCard record={record} subRate={subRate} medals={medals} byGiNogi={byGiNogi} streak={streak} />}
        {activeCard === 'year' && <YearCard year={selectedYear} record={yearRecord} medals={yearMedals} matches={yearMatches} />}
        {activeCard === 'belt' && <BeltCard byBelt={byBelt} />}
        {activeCard === 'streak' && <StreakCard streak={streak} record={record} />}
        {activeCard === 'ginogi' && <GiNoGiCard byGiNogi={byGiNogi} record={record} />}
      </div>

      <button onClick={handleDownload} style={{ width: '100%', padding: '13px', borderRadius: 10, background: 'var(--text-primary)', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.9375rem', cursor: 'pointer', fontFamily: 'var(--font-sans)', marginBottom: 8 }}>
        ↓ Download PNG
      </button>
      <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Or screenshot the card above directly</p>
    </div>
  )
}

function CardShell({ children, bg = '#1a1714', accent = '#c8952a' }: { children: React.ReactNode, bg?: string, accent?: string }) {
  return (
    <div style={{ background: bg, borderRadius: 16, padding: '24px 20px', color: '#fff', fontFamily: "'DM Sans', sans-serif", position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -50, right: -50, width: 160, height: 160, background: accent, borderRadius: '50%', opacity: 0.08 }} />
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
      <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.7rem', opacity: 0.4, letterSpacing: '0.05em' }}>BJJ TRACKER · ZACK KRAM</span>
        <span style={{ fontSize: '0.9rem' }}>🥋</span>
      </div>
    </div>
  )
}

function Stat({ label, value, color = '#fff', size = '1.75rem' }: { label: string; value: string | number; color?: string; size?: string }) {
  return (
    <div>
      <p style={{ fontSize: '0.575rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.5, marginBottom: 3 }}>{label}</p>
      <p style={{ fontSize: size, fontWeight: 700, letterSpacing: '-0.04em', color, fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>{value}</p>
    </div>
  )
}

function CareerCard({ record, subRate, medals, byGiNogi, streak }: any) {
  return (
    <CardShell>
      <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.5, marginBottom: 4 }}>Career Stats</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
        <Stat label="Record" value={`${record.wins}–${record.losses}`} color="#c8952a" />
        <Stat label="Win Rate" value={`${record.winRate}%`} />
        <Stat label="Sub Rate" value={`${subRate}%`} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
        {byGiNogi.map((g: any) => (
          <div key={g.type} style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 8, padding: '8px 10px' }}>
            <p style={{ fontSize: '0.575rem', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>{g.type}</p>
            <p style={{ fontSize: '0.9rem', fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>{g.wins}–{g.losses}</p>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <div><p style={{ fontSize: '0.575rem', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Medals</p>
          <p style={{ fontSize: '0.9rem' }}>{'🥇'.repeat(medals.gold)} {'🥈'.repeat(Math.min(medals.silver,5))} {'🥉'.repeat(medals.bronze)}</p>
        </div>
        <div><p style={{ fontSize: '0.575rem', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Streak</p>
          <p style={{ fontSize: '0.875rem', fontWeight: 700 }}>{streak.count} {streak.type}s {streak.type === 'Win' ? '🔥' : '💪'}</p>
        </div>
      </div>
    </CardShell>
  )
}

function YearCard({ year, record, medals, matches }: any) {
  const tournaments = new Set(matches.map((m: Match) => m.tournament)).size
  const subs = matches.filter((m: Match) => m.result === 'Win' && m.method?.toLowerCase().includes('sub')).length
  return (
    <CardShell bg="#1e3a5f" accent="#60a5fa">
      <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.5, marginBottom: 4 }}>{year} Season</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <Stat label="Record" value={`${record.wins}–${record.losses}`} color="#60a5fa" />
        <Stat label="Win Rate" value={`${record.winRate}%`} />
        <Stat label="Tournaments" value={tournaments} />
        <Stat label="Submissions" value={subs} />
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {medals.gold > 0 && <span style={{ background: 'rgba(255,215,0,0.15)', borderRadius: 8, padding: '5px 10px', fontSize: '0.8rem', fontWeight: 700 }}>{medals.gold}× 🥇</span>}
        {medals.silver > 0 && <span style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: '5px 10px', fontSize: '0.8rem', fontWeight: 700 }}>{medals.silver}× 🥈</span>}
        {medals.bronze > 0 && <span style={{ background: 'rgba(205,127,50,0.15)', borderRadius: 8, padding: '5px 10px', fontSize: '0.8rem', fontWeight: 700 }}>{medals.bronze}× 🥉</span>}
      </div>
    </CardShell>
  )
}

function BeltCard({ byBelt }: any) {
  const beltColors: Record<string, string> = { White: '#e5e7eb', Blue: '#3b82f6', Purple: '#8b5cf6', Brown: '#92400e', Black: '#111827' }
  return (
    <CardShell bg="#1a1714" accent="#8b5cf6">
      <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.5, marginBottom: 4 }}>Belt Journey</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {byBelt.map((b: any) => (
          <div key={b.belt} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: beltColors[b.belt] || '#ccc', flexShrink: 0 }} />
            <span style={{ width: 56, fontSize: '0.8125rem', fontWeight: 600, opacity: 0.9 }}>{b.belt}</span>
            <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${b.winRate}%`, background: beltColors[b.belt] || '#ccc', borderRadius: 99, opacity: 0.8 }} />
            </div>
            <span style={{ fontSize: '0.8rem', fontFamily: "'DM Mono', monospace", opacity: 0.7, minWidth: 50, textAlign: 'right' }}>{b.wins}–{b.losses}</span>
            <span style={{ fontSize: '0.7rem', fontFamily: "'DM Mono', monospace", color: '#c8952a', minWidth: 34, textAlign: 'right' }}>{b.winRate}%</span>
          </div>
        ))}
      </div>
    </CardShell>
  )
}

function StreakCard({ streak, record }: any) {
  const isWin = streak.type === 'Win'
  return (
    <CardShell bg={isWin ? '#0f2d1f' : '#2d0f0f'} accent={isWin ? '#22c55e' : '#ef4444'}>
      <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.5, marginBottom: 4 }}>Current Form</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <p style={{ fontSize: '4rem', fontWeight: 900, fontFamily: "'DM Mono', monospace", letterSpacing: '-0.05em', color: isWin ? '#22c55e' : '#ef4444', lineHeight: 1 }}>{streak.count}</p>
        <div>
          <p style={{ fontSize: '1.25rem', fontWeight: 800 }}>{isWin ? 'Win' : 'Loss'} Streak</p>
          <p style={{ fontSize: '1.25rem' }}>{isWin ? '🔥' : '💪'}</p>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <Stat label="Overall" value={`${record.wins}–${record.losses}`} size="1.1rem" />
        <Stat label="Win %" value={`${record.winRate}%`} size="1.1rem" />
        <Stat label="Matches" value={record.total} size="1.1rem" />
      </div>
    </CardShell>
  )
}

function GiNoGiCard({ byGiNogi, record }: any) {
  return (
    <CardShell bg="#1a2030" accent="#f59e0b">
      <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.5, marginBottom: 4 }}>Gi vs No Gi</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 16 }}>
        {byGiNogi.map((g: any) => (
          <div key={g.type}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{g.type}</span>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.9rem', opacity: 0.8 }}>{g.wins}–{g.losses} ({g.winRate}%)</span>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${g.winRate}%`, background: '#f59e0b', borderRadius: 99 }} />
            </div>
          </div>
        ))}
      </div>
      <Stat label="Overall Record" value={`${record.wins}–${record.losses}`} color="#f59e0b" />
    </CardShell>
  )
}
