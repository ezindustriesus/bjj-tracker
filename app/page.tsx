import { createServiceClient } from '@/lib/supabase'
import { Match } from '@/lib/supabase'
import { calcOverallRecord, calcSubmissionRate, calcMedalCounts, groupByYear, groupByBelt, groupByGiNogi, getCurrentStreak } from '@/lib/stats'
import StatCard from '@/components/StatCard'
import WinRateChart from '@/components/WinRateChart'
import RecentMatches from '@/components/RecentMatches'
import BeltBreakdown from '@/components/BeltBreakdown'

export const revalidate = 60

async function getMatches(): Promise<Match[]> {
  const supabase = createServiceClient()
  const { data } = await supabase.from('matches').select('*').order('date', { ascending: false })
  return data || []
}

export default async function Dashboard() {
  const matches = await getMatches()
  const record = calcOverallRecord(matches)
  const subRate = calcSubmissionRate(matches)
  const medals = calcMedalCounts(matches)
  const streak = getCurrentStreak(matches)
  const byYear = groupByYear(matches)
  const byBelt = groupByBelt(matches)
  const byGiNogi = groupByGiNogi(matches)
  const recent = matches.slice(0, 15)
  const tournaments = new Set(matches.map(m => m.tournament)).size
  const firstYear = matches.length ? new Date(matches[matches.length - 1].date).getFullYear() : 2019

  return (
    <div style={{ paddingTop: 8 }}>
      {/* Hero header */}
      <div className="fade-up" style={{ marginBottom: 32 }}>
        <p className="label" style={{ marginBottom: 6 }}>Zack Kram · Purple Belt</p>
        <h1 className="heading-1" style={{ marginBottom: 4 }}>Competition Record</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          {record.total} matches across {tournaments} tournaments · {firstYear}–present
        </p>
      </div>

      {/* Top stat cards */}
      <div className="fade-up-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
        <StatCard label="Overall Record" value={`${record.wins}–${record.losses}`} sub={`${record.winRate}% win rate`} accent icon="🏆" />
        <StatCard label="Submission Rate" value={`${subRate}%`} sub="of wins by submission" icon="🔒" />
        <StatCard label="Current Streak" value={`${streak.count} ${streak.type}${streak.count !== 1 ? 's' : ''}`} sub={streak.type === 'Win' ? 'keep it rolling' : 'time to bounce back'} icon={streak.type === 'Win' ? '🔥' : '💪'} />
        <StatCard label="Medals" value={medals.total} sub={`${medals.gold} gold · ${medals.silver} silver · ${medals.bronze} bronze`} icon="🥇" />
      </div>

      {/* Gi / No Gi / Suit */}
      <div className="fade-up-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {byGiNogi.map(g => (
          <div key={g.type} className="card-sm" style={{ textAlign: 'center' }}>
            <p className="label" style={{ marginBottom: 8 }}>{g.type}</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.03em', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', lineHeight: 1 }}>{g.wins}–{g.losses}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>{g.winRate}%</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="fade-up-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div className="card">
          <p className="heading-2" style={{ marginBottom: 4 }}>Wins by Year</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 20 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginRight: 12 }}>
              <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: '#1a7a4a' }} /> Wins
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: '#e5ddd4' }} /> Losses
            </span>
          </p>
          <WinRateChart data={byYear} />
        </div>
        <div className="card">
          <p className="heading-2" style={{ marginBottom: 20 }}>Record by Belt</p>
          <BeltBreakdown data={byBelt} />
        </div>
      </div>

      {/* Recent matches */}
      <div className="fade-up-4 card" style={{ overflowX: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <p className="heading-2">Recent Matches</p>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Last {recent.length}</span>
        </div>
        <div style={{ minWidth: 520 }}>
          <RecentMatches matches={recent} />
        </div>
      </div>
    </div>
  )
}
