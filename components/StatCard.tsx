import { ReactNode } from 'react'

interface Props {
  label: string
  value: string | number
  sub?: string
  accent?: boolean
  icon?: string
}

export default function StatCard({ label, value, sub, accent, icon }: Props) {
  return (
    <div className="card" style={{
      background: accent ? 'var(--text-primary)' : 'var(--surface)',
      border: accent ? 'none' : '1px solid var(--border)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <p className="label" style={{ color: accent ? 'rgba(255,255,255,0.5)' : undefined }}>{label}</p>
        {icon && <span style={{ fontSize: 18 }}>{icon}</span>}
      </div>
      <p style={{
        fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
        fontWeight: 700,
        letterSpacing: '-0.03em',
        color: accent ? '#fff' : 'var(--text-primary)',
        lineHeight: 1,
        marginBottom: 6,
        fontFamily: 'var(--font-mono)',
      }}>{value}</p>
      {sub && <p style={{ fontSize: '0.8125rem', color: accent ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)', marginTop: 2 }}>{sub}</p>}
    </div>
  )
}
