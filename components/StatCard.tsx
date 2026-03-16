import { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  accent?: boolean
  icon?: ReactNode
}

export default function StatCard({ label, value, sub, accent, icon }: StatCardProps) {
  return (
    <div className={`rounded-xl p-4 border ${accent ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-zinc-900 border-zinc-800'}`}>
      <div className="flex items-start justify-between">
        <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">{label}</p>
        {icon && <span className="text-zinc-600">{icon}</span>}
      </div>
      <p className={`text-3xl font-bold mt-1 ${accent ? 'text-yellow-400' : 'text-white'}`}>{value}</p>
      {sub && <p className="text-xs text-zinc-500 mt-0.5">{sub}</p>}
    </div>
  )
}
