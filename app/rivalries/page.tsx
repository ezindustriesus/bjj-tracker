'use client'
import { useEffect, useState } from 'react'
import { Match } from '@/lib/supabase'
import { getTopOpponents } from '@/lib/stats'

export default function RivalriesPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/matches')
      .then(r => r.json())
      .then(data => { setMatches(data); setLoading(false) })
  }, [])

  const rivals = getTopOpponents(matches, 2)
  const opponentMatches = selected
    ? matches.filter(m => m.opponent === selected).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Rivalries</h1>
        <p className="text-zinc-500 text-sm mt-1">Head-to-head records vs repeat opponents</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-zinc-500">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Rivals list */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-3">
              Opponents faced 2+ times ({rivals.length})
            </p>
            <div className="space-y-2">
              {rivals.map(r => (
                <button
                  key={r.opponent}
                  onClick={() => setSelected(selected === r.opponent ? null : r.opponent)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                    selected === r.opponent
                      ? 'bg-yellow-500/10 border border-yellow-500/30'
                      : 'bg-zinc-800 hover:bg-zinc-700 border border-transparent'
                  }`}
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-zinc-200">{r.opponent}</p>
                    <p className="text-xs text-zinc-500">{r.total} matches</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-green-400">{r.wins}</span>
                    <span className="text-zinc-600 mx-1">-</span>
                    <span className="text-sm font-bold text-red-400">{r.losses}</span>
                  </div>
                  <div className={`text-xs px-2 py-1 rounded font-medium ${
                    r.wins > r.losses ? 'bg-green-500/10 text-green-400' :
                    r.losses > r.wins ? 'bg-red-500/10 text-red-400' :
                    'bg-zinc-700 text-zinc-400'
                  }`}>
                    {r.wins > r.losses ? 'W' : r.losses > r.wins ? 'L' : 'T'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Match history for selected rival */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            {selected ? (
              <>
                <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-1">
                  vs {selected}
                </p>
                <p className="text-xs text-zinc-600 mb-3">Full match history</p>
                <div className="space-y-2">
                  {opponentMatches.map((m, i) => (
                    <div key={i} className="flex items-start gap-3 p-2.5 bg-zinc-800 rounded-lg">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${
                        m.result === 'Win' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                      }`}>
                        {m.result === 'Win' ? 'W' : 'L'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-zinc-300">{m.tournament}</p>
                        <p className="text-xs text-zinc-500">{m.method} · {m.belt} · {m.gi_nogi}</p>
                        {m.score && <p className="text-xs text-zinc-600">Score: {m.score}</p>}
                      </div>
                      <p className="text-xs text-zinc-600 flex-shrink-0">
                        {new Date(m.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-40 text-zinc-600 text-sm">
                Select an opponent to see match history
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
