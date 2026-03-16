import type { Metadata } from 'next'
import './globals.css'
import Nav from '@/components/Nav'
import { AuthProvider } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'BJJ Tracker | Zack Kram',
  description: 'BJJ competition analytics',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AuthProvider>
          <Nav />
          <main style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px 60px' }}>
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  )
}
