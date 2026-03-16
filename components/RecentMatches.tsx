import { Match } from '@/lib/supabase'

interface Props { matches: Match[] }

function giClass(gi: string) {
  if (gi === 'Gi') return 'badge badge-gi'
  if (gi === 'No Gi') return 'badge badge-nogi'
  return 'badge badge-suit'
}

function medalEmoji(medal: string | null | undefined) {
  if (!medal) return null
  if (medal === 'Gold') return '🥇'
  if (medal === 'Silver') return '🥈'
  if (medal === 'Bronze') return '🥉'
  return null
}

export default function RecentMatches({ matches }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Header row */}
      <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 120px 90px 70px', gap: 12, padding: '0 0 10px', borderBottom: '1px solid var(--border)' }}>
        {['Result', 'Opponent / Tournament', 'Method', 'Division', 'Date'].map(h => (
          <p key={h} className="label" style={{ fontSize: '0.6rem' }}>{h}</p>
        ))}
      </div>
      {matches.map((m, i) => (
        <div key={i} style={{
          display: 'grid',
          gridTemplateColumns: '60px 1fr 120px 90px 70px',
          gap: 12,
          padding: '12px 0',
          borderBottom: '1px solid var(--border)',
          alignItems: 'center',
          animation: `fadeUp 0.3s ${i * 0.04}s ease both`,
        }}>
          {/* Result */}
          <span className={`badge ${m.result === 'Win' ? 'badge-win' : 'badge-loss'}`} style={{ width: 'fit-content' }}>
            {m.result}
          </span>
          {/* Opponent */}
          <div style={{ minWidth: 0 }}>
            <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {m.opponent === 'Unknown' ? '—' : m.opponent}
              {medalEmoji(m.medal) && <span style={{ marginLeft: 6 }}>{medalEmoji(m.medal)}</span>}
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>{m.tournament}</p>
          </div>
          {/* Method */}
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.method || '—'}</p>
          {/* Division */}
          <span className={giClass(m.gi_nogi || '')} style={{ width: 'fit-content', fontSize: '0.6875rem' }}>{m.gi_nogi}</span>
          {/* Date */}
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
            {new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
          </p>
        </div>
      ))}
    </div>
  )
}
