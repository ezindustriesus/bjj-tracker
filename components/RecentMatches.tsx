import { Match } from '@/lib/supabase'
import { format } from 'date-fns'

interface Props {
  matches: Match[]
}

export default function RecentMatches({ matches }: Props) {
  return (
    <div className="space-y-1">
      {matches.map((m, i) => (
        <div key={i} className="flex items-center gap-3 py-2 border-b border-zinc-800 last:border-0">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
            m.result === 'Win'
              ? 'bg-green-500/10 text-green-400'
              : 'bg-red-500/10 text-red-400'
          }`}>
            {m.result === 'Win' ? 'W' : 'L'}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-zinc-200 truncate">
              {m.opponent === 'Unknown' ? 'Unknown Opponent' : m.opponent}
            </p>
            <p className="text-xs text-zinc-500 truncate">{m.tournament}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-zinc-400">{m.method}</p>
            <p className="text-xs text-zinc-600">{format(new Date(m.date), 'MMM d, yy')}</p>
          </div>
          <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${
            m.gi_nogi === 'Gi' ? 'text-blue-400 bg-blue-500/10' :
            m.gi_nogi === 'No Gi' ? 'text-orange-400 bg-orange-500/10' :
            'text-purple-400 bg-purple-500/10'
          }`}>
            {m.gi_nogi}
          </span>
        </div>
      ))}
    </div>
  )
}
