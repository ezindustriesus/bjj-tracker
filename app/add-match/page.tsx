'use client'
import { useState, useRef } from 'react'
import ManualForm from '@/components/ManualForm'
import AIImport from '@/components/AIImport'

export default function AddMatchPage() {
  const [mode, setMode] = useState<'manual' | 'ai'>('manual')

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '9px 20px',
    borderRadius: 8,
    fontWeight: 600,
    fontSize: '0.875rem',
    cursor: 'pointer',
    border: 'none',
    fontFamily: 'var(--font-sans)',
    transition: 'all 0.15s',
    background: active ? '#fff' : 'transparent',
    color: active ? 'var(--text-primary)' : 'var(--text-muted)',
    boxShadow: active ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
  })

  return (
    <div style={{ paddingTop: 8, maxWidth: 680, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <p className="label" style={{ marginBottom: 4 }}>Log Result</p>
        <h1 className="heading-1">Add Match</h1>
      </div>

      {/* Mode toggle */}
      <div style={{ display: 'inline-flex', background: 'var(--surface-2)', borderRadius: 10, padding: 3, marginBottom: 24 }}>
        <button style={tabStyle(mode === 'manual')} onClick={() => setMode('manual')}>
          ✍️ Manual Entry
        </button>
        <button style={tabStyle(mode === 'ai')} onClick={() => setMode('ai')}>
          ✨ AI Import
        </button>
      </div>

      {mode === 'manual' ? <ManualForm /> : <AIImport />}
    </div>
  )
}
