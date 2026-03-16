'use client'
import { useEffect, useState, useRef } from 'react'
import { Match } from '@/lib/supabase'
import { calcOverallRecord, calcSubmissionRate, calcMedalCounts, groupByBelt, groupByYear, getCurrentStreak, groupByGiNogi } from '@/lib/stats'
import { Download } from 'lucide-react'

type CardType = 'career' | 'year' | 'belt' | 'streak' | 'gitype'

export default function ReportsPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCard, setActiveCard] = useState<CardType>('career')
  const [selectedYear, setSelectedYear] = useState('2025')
  const cardRef = useRef<HTMLDivElement>(null)
  const [copying, setCopying] = useState(false)

  useEffect(() => {
    fetch('/api/matches').then(r => r.json()).then(d => { setMatches(d); setLoading(false) })
  }, [])

  const record = calcOverallRecord(matches)
  const subRate = calcSubmissionRate(matches)
  const medals = calcMedalCounts(matches)
  const streak = getCurrentStreak(matches)
  const byBelt = groupByBelt(matches)
  const byYear = groupByYear(matches)
  const byGi = groupByGiNogi(matches)
  const yearMatches = matches.filter(m => m.date?.startsWith(selectedYear))
  const yearRecord = calcOverallRecord(yearMatches)
  const yearMedals = calcMedalCounts(yearMatches)
  const years = [...new Set(matches.map(m => m.date?.slice(0,4)))].filter(Boolean).sort((a,b) => b!.localeCompare(a!)) as string[]

  const handleDownload = async () => {
    if (!cardRef.current) return
    setCopying(true)
    try {
      // Use html2canvas if available, otherwise just screenshot instruction
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(cardRef.current, { scale: 3, backgroundColor: null, useCORS: true })
      const link = document.createElement('a')
      link.download = `bjj-stat-card-${activeCard}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch {
      alert('To save: right-click the card → Save image as')
    } finally {
      setCopying(false)
    }
  }

  const cardTypes: { id: CardType; label: string }[] = [
    { id: 'career', label: 'Career Summary' },
    { id: 'year', label: 'Year in Review' },
    { id: 'belt', label: 'Belt Progress' },
    { id: 'streak', label: 'Current Streak' },
    { id: 'gitype', label: 'Gi vs No Gi' },
  ]

  const cardStyle: React.CSSProperties = {
    width: 480, minHeight: 480,
    background: 'linear-gradient(135deg, #1a1714 0%, #2d2520 100%)',
    borderRadius: 20, padding: 40,
    display: 'flex', flexDirection: 'column',
    fontFamily: 'var(--font-sans)',
    position: 'relative', overflow: 'hidden',
  }

  const renderCard = () => {
    const bg = <div style={{ position: 'absolute', top: -60, right: -60, width: 280, height: 280, borderRadius: '50%', background: 'rgba(200,149,42,0.06)', pointerEvents: 'none' }} />
    const logo = <p style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 4 }}>🥋 BJJ TRACKER · ZACK KRAM</p>

    if (activeCard === 'career') return (
      <div style={cardStyle}>
        {bg}
        {logo}
        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: 24, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Career Overview · Purple Belt</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
          {[
            { label: 'Record', value: `${record.wins}–${record.losses}` },
            { label: 'Win Rate', value: `${record.winRate}%` },
            { label: 'Sub Rate', value: `${subRate}%` },
            { label: 'Tournaments', value: new Set(matches.map(m=>m.tournament)).size },
          ].map(s => (
            <div key={s.label}>
              <p style={{ fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>{s.label}</p>
              <p style={{ fontSize: '2.25rem', fontWeight: 700, letterSpacing: '-0.04em', fontFamily: 'var(--font-mono)', color: '#fff', lineHeight: 1 }}>{s.value}</p>
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 20, display: 'flex', gap: 20 }}>
          <div><p style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Medals</p>
            <p style={{ fontSize: '1.25rem' }}>🥇{medals.gold} 🥈{medals.silver} 🥉{medals.bronze}</p>
          </div>
          <div><p style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Streak</p>
            <p style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: streak.type === 'Win' ? '#4ade80' : '#f87171', fontSize: '1.1rem' }}>{streak.count} {streak.type}s</p>
          </div>
        </div>
        <p style={{ marginTop: 'auto', paddingTop: 20, fontSize: '0.625rem', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.08em' }}>bjj-tracker-ochre.vercel.app</p>
      </div>
    )

    if (activeCard === 'year') {
      const yr = byYear.find(y => y.year === selectedYear)
      return (
        <div style={cardStyle}>
          {bg}
          {logo}
          <p style={{ fontSize: '3rem', fontWeight: 800, letterSpacing: '-0.05em', color: 'rgba(200,149,42,0.3)', lineHeight: 1, marginBottom: 4 }}>{selectedYear}</p>
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: 28, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Year in Review</p>
          {yr ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
                {[
                  { label: 'Record', value: `${yr.wins}–${yr.losses}` },
                  { label: 'Win Rate', value: `${yr.winRate}%` },
                  { label: 'Matches', value: yr.total },
                  { label: 'Medals', value: `🥇${yearMedals.gold} 🥈${yearMedals.silver}` },
                ].map(s => (
                  <div key={s.label}>
                    <p style={{ fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>{s.label}</p>
                    <p style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.04em', fontFamily: 'var(--font-mono)', color: '#fff', lineHeight: 1 }}>{s.value}</p>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                {new Set(yearMatches.map(m=>m.tournament)).size} tournaments · {yearRecord.wins} wins · {calcSubmissionRate(yearMatches)}% sub rate
              </p>
            </>
          ) : <p style={{ color: 'rgba(255,255,255,0.4)' }}>No data for {selectedYear}</p>}
          <p style={{ marginTop: 'auto', paddingTop: 20, fontSize: '0.625rem', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.08em' }}>bjj-tracker-ochre.vercel.app</p>
        </div>
      )
    }

    if (activeCard === 'belt') return (
      <div style={cardStyle}>
        {bg}
        {logo}
        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: 28, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Belt Progression</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
          {byBelt.map(b => {
            const colors: Record<string,string> = { White:'#f0ede8', Blue:'#3b7dd8', Purple:'#8b5cf6', Brown:'#92400e', Black:'#fff' }
            return (
              <div key={b.belt}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: colors[b.belt]||'#ccc' }} />
                    <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>{b.belt}</span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>{b.wins}–{b.losses} ({b.winRate}%)</span>
                </div>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 99 }}>
                  <div style={{ height: '100%', width: `${b.winRate}%`, background: colors[b.belt]||'#ccc', borderRadius: 99 }} />
                </div>
              </div>
            )
          })}
        </div>
        <p style={{ marginTop: 'auto', fontSize: '0.625rem', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.08em' }}>bjj-tracker-ochre.vercel.app</p>
      </div>
    )

    if (activeCard === 'streak') return (
      <div style={{ ...cardStyle, alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        {bg}
        {logo}
        <p style={{ fontSize: '8rem', lineHeight: 1, marginBottom: 8 }}>{streak.type === 'Win' ? '🔥' : '💪'}</p>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '4rem', fontWeight: 800, letterSpacing: '-0.05em', color: streak.type === 'Win' ? '#4ade80' : '#f87171', lineHeight: 1 }}>{streak.count}</p>
        <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginTop: 8, marginBottom: 4 }}>{streak.type} Streak</p>
        <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)' }}>Current · {record.total} career matches</p>
        <p style={{ marginTop: 40, fontSize: '0.625rem', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.08em' }}>bjj-tracker-ochre.vercel.app</p>
      </div>
    )

    if (activeCard === 'gitype') return (
      <div style={cardStyle}>
        {bg}
        {logo}
        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: 28, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Gi vs No Gi vs Suit</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {byGi.map(g => {
            const colors: Record<string,string> = { Gi: '#3b7dd8', 'No Gi': '#f59e0b', Suit: '#8b5cf6' }
            return (
              <div key={g.type}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, color: '#fff', fontSize: '1.1rem' }}>{g.type}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: colors[g.type]||'#fff', fontSize: '1.1rem' }}>{g.wins}–{g.losses} · {g.winRate}%</span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 99 }}>
                  <div style={{ height: '100%', width: `${g.winRate}%`, background: colors[g.type]||'#fff', borderRadius: 99 }} />
                </div>
              </div>
            )
          })}
        </div>
        <p style={{ marginTop: 'auto', paddingTop: 28, fontSize: '0.625rem', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.08em' }}>bjj-tracker-ochre.vercel.app</p>
      </div>
    )
  }

  return (
    <div style={{ paddingTop: 8 }}>
      <div style={{ marginBottom: 24 }}>
        <p className="label" style={{ marginBottom: 4 }}>Share Your Stats</p>
        <h1 className="heading-1">Reports</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 4 }}>Generate stat cards to share on Instagram or social media</p>
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading...</div> : (
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24, alignItems: 'start' }}>
          {/* Card type selector */}
          <div className="card" style={{ padding: 16 }}>
            <p className="label" style={{ marginBottom: 12 }}>Card Type</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {cardTypes.map(c => (
                <button key={c.id} onClick={() => setActiveCard(c.id)} style={{
                  padding: '9px 12px', borderRadius: 8, fontWeight: 500, fontSize: '0.875rem',
                  cursor: 'pointer', textAlign: 'left', border: 'none', fontFamily: 'var(--font-sans)',
                  background: activeCard === c.id ? 'var(--surface-2)' : 'transparent',
                  color: activeCard === c.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                  transition: 'all 0.15s',
                }}>
                  {c.label}
                </button>
              ))}
            </div>

            {activeCard === 'year' && (
              <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                <p className="label" style={{ marginBottom: 8 }}>Year</p>
                <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 7, padding: '7px 10px', fontSize: '0.875rem', outline: 'none' }}>
                  {years.map(y => <option key={y}>{y}</option>)}
                </select>
              </div>
            )}

            <button onClick={handleDownload} disabled={copying} style={{ marginTop: 16, width: '100%', padding: '10px', borderRadius: 8, fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', border: 'none', background: 'var(--gold)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'var(--font-sans)' }}>
              <Download size={14} /> {copying ? 'Saving...' : 'Download PNG'}
            </button>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8, textAlign: 'center' }}>Or right-click → Save image as</p>
          </div>

          {/* Card preview */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <p className="label" style={{ alignSelf: 'flex-start' }}>Preview</p>
            <div ref={cardRef} style={{ display: 'inline-block' }}>
              {renderCard()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
