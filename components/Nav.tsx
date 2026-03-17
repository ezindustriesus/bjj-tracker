'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { useState } from 'react'

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/matches', label: 'Matches' },
  { href: '/tournaments', label: 'Tournaments' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/rivalries', label: 'Rivalries' },
  { href: '/reports', label: 'Reports' },
  { href: '/insights', label: '✦ AI' },
]

export default function Nav() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, profile, isAdmin, signOut, loading } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
    setMenuOpen(false)
  }

  return (
    <>
      <header style={{ background: '#fff', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 100, marginBottom: 24 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <span style={{ fontSize: 20 }}>🥋</span>
            <span style={{ fontWeight: 700, fontSize: '0.9375rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>BJJ Tracker</span>
          </Link>

          {/* Desktop nav */}
          <nav style={{ display: 'none', gap: 2, alignItems: 'center' }} className="desktop-nav">
            {links.map(({ href, label }) => {
              const active = pathname === href
              const isAI = label.startsWith('✦')
              return (
                <Link key={href} href={href} style={{ padding: '6px 10px', borderRadius: 7, fontSize: '0.8125rem', fontWeight: 500, textDecoration: 'none', transition: 'all 0.15s', background: isAI ? 'var(--text-primary)' : active ? 'var(--surface-2)' : 'transparent', color: isAI ? '#fff' : active ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                  {label}
                </Link>
              )
            })}
            {isAdmin && <Link href="/add-match" style={{ padding: '6px 12px', borderRadius: 7, fontSize: '0.8125rem', fontWeight: 600, textDecoration: 'none', background: 'var(--gold)', color: '#fff', marginLeft: 4 }}>+ Add</Link>}
            {!loading && user && (
              <button onClick={handleSignOut} style={{ marginLeft: 8, padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sign out</button>
            )}
            {!loading && !user && (
              <Link href="/login" style={{ marginLeft: 8, padding: '6px 12px', borderRadius: 7, fontSize: '0.8125rem', fontWeight: 600, textDecoration: 'none', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>Sign in</Link>
            )}
          </nav>

          {/* Mobile right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="mobile-controls">
            {!loading && !user && <Link href="/login" style={{ padding: '6px 12px', borderRadius: 7, fontSize: '0.8125rem', fontWeight: 600, textDecoration: 'none', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>Sign in</Link>}
            {!loading && user && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{profile?.role === 'admin' ? '⭐' : '👤'}</span>}
            <button onClick={() => setMenuOpen(o => !o)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}>
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {menuOpen && (
        <>
          <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.2)', zIndex: 200 }} />
          <div style={{ position: 'fixed', top: 56, right: 0, bottom: 0, width: 240, background: '#fff', zIndex: 201, borderLeft: '1px solid var(--border)', overflowY: 'auto', display: 'flex', flexDirection: 'column', padding: '12px 0' }}>
            {links.map(({ href, label }) => {
              const active = pathname === href
              const isAI = label.startsWith('✦')
              return (
                <Link key={href} href={href} onClick={() => setMenuOpen(false)} style={{ padding: '12px 20px', fontSize: '0.9375rem', fontWeight: active ? 700 : 500, textDecoration: 'none', color: isAI ? 'var(--text-primary)' : active ? 'var(--gold)' : 'var(--text-primary)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, background: active ? 'var(--gold-light)' : 'transparent' }}>
                  {isAI && <span>✦</span>}{label.replace('✦ ', '')}
                </Link>
              )
            })}
            {isAdmin && (
              <Link href="/add-match" onClick={() => setMenuOpen(false)} style={{ margin: '12px 16px', padding: '12px', borderRadius: 9, fontSize: '0.9375rem', fontWeight: 700, textDecoration: 'none', background: 'var(--gold)', color: '#fff', textAlign: 'center' }}>
                + Add Match
              </Link>
            )}
            {user && (
              <button onClick={handleSignOut} style={{ margin: '4px 16px', padding: '12px', borderRadius: 9, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Sign Out
              </button>
            )}
            {isAdmin && (
              <Link href="/admin" onClick={() => setMenuOpen(false)} style={{ padding: '12px 20px', fontSize: '0.8125rem', textDecoration: 'none', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', marginTop: 'auto' }}>
                ⚙️ Admin
              </Link>
            )}
          </div>
        </>
      )}

      <style>{`
        @media (min-width: 768px) {
          .desktop-nav { display: flex !important; }
          .mobile-controls { display: none !important; }
        }
      `}</style>
    </>
  )
}
