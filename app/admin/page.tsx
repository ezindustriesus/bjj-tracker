'use client'
import { useEffect, useState } from 'react'

type UserRecord = { id: string; email: string; role: string | null; created_at: string }

export default function AdminPage() {
  const [users, setUsers] = useState<UserRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [myRole, setMyRole] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      setMyRole(d.role)
      if (d.role === 'admin') {
        fetch('/api/auth/users').then(r => r.json()).then(d => { setUsers(d.users || []); setLoading(false) })
      } else { setLoading(false) }
    })
  }, [])

  const setRole = async (userId: string, role: string) => {
    await fetch('/api/auth/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, role }) })
    setUsers(us => us.map(u => u.id === userId ? { ...u, role } : u))
  }

  const removeUser = async (userId: string) => {
    if (!confirm('Remove this user?')) return
    await fetch('/api/auth/users', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId }) })
    setUsers(us => us.filter(u => u.id !== userId))
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading...</div>
  if (myRole !== 'admin') return (
    <div style={{ textAlign: 'center', padding: 80 }}>
      <p style={{ fontSize: 40, marginBottom: 16 }}>🔒</p>
      <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Admin only</p>
    </div>
  )

  const pending = users.filter(u => !u.role)
  const active = users.filter(u => u.role)

  return (
    <div style={{ paddingTop: 8, maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <p className="label" style={{ marginBottom: 4 }}>Settings</p>
        <h1 className="heading-1">User Management</h1>
      </div>

      {pending.length > 0 && (
        <div className="card" style={{ marginBottom: 16, border: '1px solid var(--gold-border)', background: 'var(--gold-light)' }}>
          <p className="heading-2" style={{ marginBottom: 14, color: 'var(--gold)' }}>⏳ Pending Approval ({pending.length})</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pending.map(u => (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#fff', borderRadius: 10, border: '1px solid var(--gold-border)', flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{u.email}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(u.created_at).toLocaleDateString()}</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setRole(u.id, 'viewer')} style={{ padding: '6px 14px', borderRadius: 7, background: 'var(--win-bg)', color: 'var(--win)', border: '1px solid var(--win)', fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>Approve Viewer</button>
                  <button onClick={() => setRole(u.id, 'admin')} style={{ padding: '6px 14px', borderRadius: 7, background: 'var(--gold-light)', color: 'var(--gold)', border: '1px solid var(--gold-border)', fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>Make Admin</button>
                  <button onClick={() => removeUser(u.id)} style={{ padding: '6px 10px', borderRadius: 7, background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', fontSize: '0.8125rem', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)' }}>
          <p className="heading-2">Active Users ({active.length})</p>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Email','Role','Joined','Actions'].map(h => <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {active.map((u, i) => (
              <tr key={u.id} style={{ borderBottom: i < active.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <td style={{ padding: '14px 20px', fontWeight: 500, fontSize: '0.9rem' }}>{u.email}</td>
                <td style={{ padding: '14px 20px' }}>
                  <span className={`badge ${u.role === 'admin' ? 'badge-nogi' : 'badge-gi'}`}>{u.role}</span>
                </td>
                <td style={{ padding: '14px 20px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                <td style={{ padding: '14px 20px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {u.role !== 'admin' && <button onClick={() => setRole(u.id, 'admin')} style={{ padding: '5px 10px', borderRadius: 6, background: 'var(--surface-2)', border: '1px solid var(--border)', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'var(--font-sans)', color: 'var(--text-secondary)' }}>→ Admin</button>}
                    {u.role !== 'viewer' && <button onClick={() => setRole(u.id, 'viewer')} style={{ padding: '5px 10px', borderRadius: 6, background: 'var(--surface-2)', border: '1px solid var(--border)', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'var(--font-sans)', color: 'var(--text-secondary)' }}>→ Viewer</button>}
                    <button onClick={() => removeUser(u.id)} style={{ padding: '5px 10px', borderRadius: 6, background: 'var(--loss-bg)', border: '1px solid var(--loss)', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'var(--font-sans)', color: 'var(--loss)' }}>Remove</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
