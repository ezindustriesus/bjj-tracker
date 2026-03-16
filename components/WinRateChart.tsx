'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts'

interface Props {
  data: { year: string; wins: number; losses: number; winRate: number }[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const wins = payload.find((p: any) => p.dataKey === 'wins')?.value || 0
  const losses = payload.find((p: any) => p.dataKey === 'losses')?.value || 0
  const rate = wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : 0
  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 13 }}>
      <p style={{ fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)' }}>{label}</p>
      <p style={{ color: 'var(--win)' }}>W: {wins}</p>
      <p style={{ color: 'var(--loss)' }}>L: {losses}</p>
      <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{rate}%</p>
    </div>
  )
}

export default function WinRateChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} barGap={3} barCategoryGap="30%">
        <XAxis dataKey="year" tick={{ fill: '#a39b8f', fontSize: 12, fontFamily: 'var(--font-sans)' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#a39b8f', fontSize: 11 }} axisLine={false} tickLine={false} width={24} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
        <Bar dataKey="wins" fill="#1a7a4a" radius={[4, 4, 0, 0]} />
        <Bar dataKey="losses" fill="#e5ddd4" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
