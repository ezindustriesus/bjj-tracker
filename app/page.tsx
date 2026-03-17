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

  return (
    <div style={{ paddingTop: 8 }}>
      <div className="fade-up" style={{ marginBottom: 24 }}>
        <p className="label" style={{ marginBottom: 4 }}>Zack Kram · Purple Belt</p>
        <h1 className="heading-1">Competition Record</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 4 }}>
          {record.total} matches · {tournaments} tournaments · 2019–present
        </p>
      </div>

      {/* Stats - 2 col on mobile, 4 on desktop */}
      <div className="fade-up-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 12 }}>
        <StatCard label="Overall Record" value={`${record.wins}–${record.losses}`} sub={`${record.winRate}% win rate`} accent icon="🏆" />
        <StatCard label="Sub Rate" value={`${subRate}%`} sub="of wins" icon="🔒" />
        <StatCard label="Streak" value={`${streak.count} ${streak.type}${streak.count !== 1 ? 's' : ''}`} sub={streak.type === 'Win' ? 'keep rolling' : 'bounce back'} icon={streak.type === 'Win' ? '🔥' : '💪'} />
        <StatCard label="Medals" value={medals.total} sub={`${medals.gold}🥇 ${medals.silver}🥈 ${medals.bronze}🥉`} icon="🎖️" />
      </div>

      {/* Gi split - 3 col */}
      <div className="fade-up-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
        {byGiNogi.map(g => (
          <div key={g.type} className="card-sm" style={{ textAlign: 'center' }}>
            <p className="label" style={{ marginBottom: 6, fontSize: '0.55rem' }}>{g.type}</p>
            <p style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '-0.03em', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', lineHeight: 1 }}>{g.wins}–{g.losses}</p>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 3 }}>{g.winRate}%</p>
          </div>
        ))}
      </div>

      {/* Charts - stacked on mobile */}
      <div className="fade-up-3" style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 12 }}>
        <div className="card">
          <p className="heading-2" style={{ marginBottom: 4 }}>Wins by Year</p>
          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', color: 'var(--text-muted)' }}><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: '#1a7a4a' }} /> Wins</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', color: 'var(--text-muted)' }}><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: '#e5ddd4' }} /> Losses</span>
          </div>
          <WinRateChart data={byYear} />
        </div>
        <div className="card">
          <p className="heading-2" style={{ marginBottom: 16 }}>Record by Belt</p>
          <BeltBreakdown data={byBelt} />
        </div>
      </div>

      {/* Recent matches - scrollable */}
      <div className="fade-up-4 card" style={{ overflowX: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <p className="heading-2">Recent Matches</p>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Last {recent.length}</span>
        </div>
        <div style={{ minWidth: 480 }}>
          <RecentMatches matches={recent} />
        </div>
      </div>
    </div>
  )
}
