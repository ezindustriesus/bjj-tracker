'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/matches', label: 'Matches' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/rivalries', label: 'Rivalries' },
  { href: '/add-match', label: '+ Add Match' },
]

export default function Nav() {
  const pathname = usePathname()
  return (
    <header style={{ background: '#fff', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 100, marginBottom: 32 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>🥋</span>
          <span style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>BJJ Tracker</span>
        </div>
        <nav style={{ display: 'flex', gap: 2 }}>
          {links.map(({ href, label }) => {
            const active = pathname === href
            const isAdd = label.startsWith('+')
            return (
              <Link key={href} href={href} style={{
                padding: '7px 13px', borderRadius: 8, fontSize: '0.875rem', fontWeight: isAdd ? 600 : 500,
                textDecoration: 'none', transition: 'all 0.15s',
                background: isAdd ? 'var(--gold)' : active ? 'var(--surface-2)' : 'transparent',
                color: isAdd ? '#fff' : active ? 'var(--text-primary)' : 'var(--text-secondary)',
              }}>
                {label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
