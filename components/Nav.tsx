'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/matches', label: 'Matches' },
  { href: '/tournaments', label: 'Tournaments' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/rivalries', label: 'Rivalries' },
  { href: '/reports', label: 'Reports' },
  { href: '/insights', label: '✦ AI Insights' },
]

export default function Nav() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, profile, isAdmin, signOut, loading } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  return (
    <header style={{ background: '#fff', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 100, marginBottom: 32 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60, gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span style={{ fontSize: 22 }}>🥋</span>
          <span style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>BJJ Tracker</span>
        </div>
        <nav style={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', flex: 1, justifyContent: 'center' }}>
          {links.map(({ href, label }) => {
            const active = pathname === href
            const isAI = label.startsWith('✦')
            return (
              <Link key={href} href={href} style={{
                padding: '6px 11px', borderRadius: 7, fontSize: '0.8125rem', fontWeight: 500,
                textDecoration: 'none', transition: 'all 0.15s',
                background: isAI ? 'var(--text-primary)' : active ? 'var(--surface-2)' : 'transparent',
                color: isAI ? '#fff' : active ? 'var(--text-primary)' : 'var(--text-secondary)',
              }}>
                {label}
              </Link>
            )
          })}
          {isAdmin && (
            <Link href="/add-match" style={{ padding: '6px 12px', borderRadius: 7, fontSize: '0.8125rem', fontWeight: 600, textDecoration: 'none', background: 'var(--gold)', color: '#fff', marginLeft: 4 }}>
              + Add Match
            </Link>
          )}
        </nav>
        {!loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {user ? (
              <>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1 }}>{profile?.display_name || user.email?.split('@')[0]}</p>
                  <p style={{ fontSize: '0.6rem', color: profile?.role === 'admin' ? 'var(--gold)' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{profile?.role || 'viewer'}</p>
                </div>
                {isAdmin && (
                  <Link href="/admin" style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid var(--gold-border)', background: 'var(--gold-light)', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--gold)', fontWeight: 600, textDecoration: 'none' }}>
                    Admin
                  </Link>
                )}
                <button onClick={handleSignOut} style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>
                  Sign out
                </button>
              </>
            ) : (
              <Link href="/login" style={{ padding: '6px 12px', borderRadius: 7, fontSize: '0.8125rem', fontWeight: 600, textDecoration: 'none', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                Sign in
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
