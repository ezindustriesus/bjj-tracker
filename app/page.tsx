import { createServiceClient } from '@/lib/supabase'
import { Match } from '@/lib/supabase'
import {
  calcOverallRecord,
  calcSubmissionRate,
  calcMedalCounts,
  groupByYear,
  groupByBelt,
  groupByGiNogi,
  getCurrentStreak,
} from '@/lib/stats'
import StatCard from '@/components/StatCard'
import WinRateChart from '@/components/WinRateChart'
import RecentMatches from '@/components/RecentMatches'
import BeltBreakdown from '@/components/BeltBreakdown'
import { Trophy, Target, Zap, TrendingUp } from 'lucide-react'

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
  const recent = matches.slice(0, 10)
  const tournaments = new Set(matches.map(m => m.tournament)).size

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Career Overview</h1>
        <p className="text-zinc-500 text-sm mt-1">{record.total} matches · {tournaments} tournaments · Sept 2019 – present</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Overall Record" value={`${record.wins}-${record.losses}`} sub={`${record.winRate}% win rate`} accent icon={<Trophy size={16} />} />
        <StatCard label="Submission Rate" value={`${subRate}%`} sub="of wins by submission" icon={<Target size={16} />} />
        <StatCard label="Current Streak" value={`${streak.count} ${streak.type}${streak.count !== 1 ? 's' : ''}`} sub={streak.type === 'Win' ? 'on a roll' : 'time to bounce back'} icon={<Zap size={16} />} />
        <StatCard label="Total Medals" value={medals.total} sub={`${medals.gold} Gold  ${medals.silver} Silver  ${medals.bronze} Bronze`} icon={<TrendingUp size={16} />} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        {byGiNogi.map(g => (
          <div key={g.type} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">{g.type}</p>
            <p className="text-2xl font-bold text-white mt-1">{g.wins}-{g.losses}</p>
            <p className="text-xs text-zinc-500">{g.winRate}%</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-zinc-300 mb-4">Win Rate by Year</h2>
          <WinRateChart data={byYear} />
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-zinc-300 mb-4">Record by Belt</h2>
          <BeltBreakdown data={byBelt} />
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-zinc-300 mb-4">Recent Matches</h2>
        <RecentMatches matches={recent} />
      </div>
    </div>
  )
}
