'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface Props {
  data: { year: string; wins: number; losses: number; winRate: number }[]
}

export default function WinRateChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} barGap={2}>
        <XAxis dataKey="year" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
        <Tooltip
          contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: '#a1a1aa' }}
          itemStyle={{ color: '#e4e4e7' }}
          formatter={(value, name) => [value, name === 'wins' ? 'Wins' : 'Losses']}
        />
        <Bar dataKey="wins" radius={[3, 3, 0, 0]} fill="#eab308" />
        <Bar dataKey="losses" radius={[3, 3, 0, 0]} fill="#3f3f46" />
      </BarChart>
    </ResponsiveContainer>
  )
}
