'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signIn, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) router.push('/')
  }, [user, router])

  const handleLogin = async () => {
    if (!email || !password) { setError('Enter email and password'); return }
    setLoading(true); setError('')
    const err = await signIn(email, password)
    if (err) { setError(err); setLoading(false) }
    else router.push('/')
  }

  const inp: React.CSSProperties = {
    width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '11px 14px', fontSize: '0.9375rem',
    color: 'var(--text-primary)', outline: 'none', fontFamily: 'var(--font-sans)',
  }

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <span style={{ fontSize: 40 }}>🥋</span>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.025em', marginTop: 12, marginBottom: 4 }}>BJJ Tracker</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Sign in to access your stats</p>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <p style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 6 }}>Email</p>
            <input type="email" style={inp} placeholder="you@example.com" value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          </div>
          <div>
            <p style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 6 }}>Password</p>
            <input type="password" style={inp} placeholder="••••••••" value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          </div>
          {error && <p style={{ color: 'var(--loss)', fontSize: '0.875rem', background: 'var(--loss-bg)', padding: '10px 12px', borderRadius: 8 }}>{error}</p>}
          <button onClick={handleLogin} disabled={loading} style={{ width: '100%', padding: '13px', borderRadius: 9, fontWeight: 700, fontSize: '0.9375rem', cursor: 'pointer', border: 'none', fontFamily: 'var(--font-sans)', background: 'var(--gold)', color: '#fff', opacity: loading ? 0.7 : 1, marginTop: 4 }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </div>
        <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 20 }}>
          Don't have access? Contact Zack to get an invite.
        </p>
      </div>
    </div>
  )
}
