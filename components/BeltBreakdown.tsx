'use client'

interface Props {
  data: { belt: string; wins: number; losses: number; winRate: number }[]
}

const beltColors: Record<string, string> = {
  White: 'bg-zinc-100',
  Blue: 'bg-blue-500',
  Purple: 'bg-purple-500',
  Brown: 'bg-amber-800',
  Black: 'bg-zinc-900 border border-zinc-600',
}

export default function BeltBreakdown({ data }: Props) {
  return (
    <div className="space-y-3">
      {data.map(b => (
        <div key={b.belt} className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${beltColors[b.belt] || 'bg-zinc-500'}`} />
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-zinc-300">{b.belt}</span>
              <span className="text-xs text-zinc-500">{b.wins}-{b.losses} ({b.winRate}%)</span>
            </div>
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-500 rounded-full"
                style={{ width: `${b.winRate}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
