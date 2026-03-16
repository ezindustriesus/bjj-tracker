'use client'

interface Props {
  data: { belt: string; wins: number; losses: number; winRate: number; total: number }[]
}

const beltDot: Record<string, string> = {
  White: '#e0ddd8',
  Blue: '#3b7dd8',
  Purple: '#8b5cf6',
  Brown: '#92400e',
  Black: '#1a1714',
}

export default function BeltBreakdown({ data }: Props) {
  const max = Math.max(...data.map(b => b.total))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {data.map(b => (
        <div key={b.belt}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: beltDot[b.belt] || '#ccc', border: b.belt === 'White' ? '1.5px solid #ccc5b9' : 'none', flexShrink: 0 }} />
              <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>{b.belt}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{b.wins}–{b.losses}</span>
              <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 600, color: b.winRate >= 70 ? 'var(--win)' : b.winRate >= 50 ? 'var(--gold)' : 'var(--loss)', minWidth: 38, textAlign: 'right' }}>{b.winRate}%</span>
            </div>
          </div>
          <div style={{ height: 6, background: 'var(--surface-2)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(b.total / max) * 100}%`, background: 'var(--border-strong)', borderRadius: 99, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${b.winRate}%`, background: beltDot[b.belt] || '#ccc', borderRadius: 99 }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
