'use client'
import { useEffect, useState } from 'react'
import { Match } from '@/lib/supabase'
import { calcOverallRecord, calcSubmissionRate, groupByYear, groupByGiNogi } from '@/lib/stats'
import WinRateChart from '@/components/WinRateChart'

export default function AnalyticsPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ belt: '', gi_nogi: '', year: '', organization: '' })

  useEffect(() => {
    async function load() {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.belt) params.set('belt', filters.belt)
      if (filters.gi_nogi) params.set('gi_nogi', filters.gi_nogi)
      if (filters.year) params.set('year', filters.year)
      if (filters.organization) params.set('organization', filters.organization)
      const res = await fetch(`/api/matches?${params}`)
      const data = await res.json()
      setMatches(data)
      setLoading(false)
    }
    load()
  }, [filters])

  const record = calcOverallRecord(matches)
  const subRate = calcSubmissionRate(matches)
  const byYear = groupByYear(matches)
  const byGiNogi = groupByGiNogi(matches)

  const methodCounts = matches.reduce((acc, m) => {
    const method = m.method || 'Unknown'
    acc[method] = (acc[method] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  const topMethods = Object.entries(methodCounts).sort((a, b) => b[1] - a[1]).slice(0, 8)

  const orgCounts = matches.reduce((acc, m) => {
    acc[m.organization] = (acc[m.organization] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const selectClass = "bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-yellow-500"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-zinc-500 text-sm mt-1">Filter and analyze performance across any dimension</p>
      </div>

      {/* Filters */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-3">Filters</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <select className={selectClass} value={filters.belt} onChange={e => setFilters(f => ({...f, belt: e.target.value}))}>
            <option value="">All Belts</option>
            <option value="White">White</option>
            <option value="Blue">Blue</option>
            <option value="Purple">Purple</option>
          </select>
          <select className={selectClass} value={filters.gi_nogi} onChange={e => setFilters(f => ({...f, gi_nogi: e.target.value}))}>
            <option value="">All Types</option>
            <option value="Gi">Gi</option>
            <option value="No Gi">No Gi</option>
            <option value="Suit">Suit</option>
          </select>
          <select className={selectClass} value={filters.year} onChange={e => setFilters(f => ({...f, year: e.target.value}))}>
            <option value="">All Years</option>
            {[2026,2025,2024,2023,2022,2019].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select className={selectClass} value={filters.organization} onChange={e => setFilters(f => ({...f, organization: e.target.value}))}>
            <option value="">All Orgs</option>
            {['AGF','IBJJF','Springfield BJJ','Newbreed','Chewjitsu','Grappling Industries','Fuji BJJ','JJ Outlet'].map(o => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>
        {(filters.belt || filters.gi_nogi || filters.year || filters.organization) && (
          <button onClick={() => setFilters({ belt: '', gi_nogi: '', year: '', organization: '' })}
            className="mt-3 text-xs text-yellow-400 hover:text-yellow-300">
            Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-zinc-500">Loading...</div>
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-xs text-zinc-500 uppercase tracking-wider">Record</p>
              <p className="text-2xl font-bold text-yellow-400 mt-1">{record.wins}-{record.losses}</p>
              <p className="text-xs text-zinc-500">{record.winRate}% win rate</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-xs text-zinc-500 uppercase tracking-wider">Matches</p>
              <p className="text-2xl font-bold text-white mt-1">{record.total}</p>
              <p className="text-xs text-zinc-500">in filtered set</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-xs text-zinc-500 uppercase tracking-wider">Sub Rate</p>
              <p className="text-2xl font-bold text-white mt-1">{subRate}%</p>
              <p className="text-xs text-zinc-500">wins by submission</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-xs text-zinc-500 uppercase tracking-wider">Tournaments</p>
              <p className="text-2xl font-bold text-white mt-1">{new Set(matches.map(m => m.tournament)).size}</p>
              <p className="text-xs text-zinc-500">unique events</p>
            </div>
          </div>

          {/* Win rate by year */}
          {byYear.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <h2 className="text-sm font-semibold text-zinc-300 mb-4">Win Rate by Year</h2>
              <WinRateChart data={byYear} />
            </div>
          )}

          {/* Methods breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <h2 className="text-sm font-semibold text-zinc-300 mb-4">Finish Methods</h2>
              <div className="space-y-2">
                {topMethods.map(([method, count]) => (
                  <div key={method} className="flex items-center gap-3">
                    <span className="text-sm text-zinc-300 w-32 truncate">{method}</span>
                    <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${(count / matches.length) * 100}%` }} />
                    </div>
                    <span className="text-xs text-zinc-500 w-8 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <h2 className="text-sm font-semibold text-zinc-300 mb-4">Gi / No Gi / Suit</h2>
              <div className="space-y-3">
                {byGiNogi.map(g => (
                  <div key={g.type}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-zinc-300">{g.type}</span>
                      <span className="text-xs text-zinc-500">{g.wins}-{g.losses} ({g.winRate}%)</span>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${g.winRate}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
