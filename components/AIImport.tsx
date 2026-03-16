'use client'
import { useState, useRef, useCallback } from 'react'
import { Match } from '@/lib/supabase'

type ParsedMatch = Omit<Match, 'id' | 'created_at'>
type ImportState = 'idle' | 'parsing' | 'review' | 'saving' | 'done'

export default function AIImport() {
  const [state, setState] = useState<ImportState>('idle')
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [parsed, setParsed] = useState<ParsedMatch[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [error, setError] = useState('')
  const [savedCount, setSavedCount] = useState(0)
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (f: File) => {
    setFile(f)
    setError('')
    if (f.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = e => setPreview(e.target?.result as string)
      reader.readAsDataURL(f)
    } else {
      // For CSV/text/spreadsheet files, read as text
      const reader = new FileReader()
      reader.onload = e => {
        const content = e.target?.result as string
        setText(prev => prev ? prev + '\n\n' + content : content)
        setFile(null)
      }
      reader.readAsText(f)
      setPreview(null)
    }
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [])

  const handleParse = async () => {
    if (!text.trim() && !file && !preview) { setError('Please add some content first'); return }
    setState('parsing'); setError('')
    try {
      const body: any = {}
      if (preview) {
        // Extract base64 data from data URL
        const [header, data] = preview.split(',')
        const mediaType = header.match(/:(.*?);/)?.[1] || 'image/jpeg'
        body.imageBase64 = data
        body.imageMediaType = mediaType
      }
      if (text.trim()) body.text = text.trim()

      const res = await fetch('/api/parse-matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Parse failed')
      if (!data.matches?.length) throw new Error('No match data found. Try adding more detail or a clearer image.')
      setParsed(data.matches)
      setSelected(new Set(data.matches.map((_: any, i: number) => i)))
      setState('review')
    } catch (err: any) {
      setError(err.message)
      setState('idle')
    }
  }

  const handleSave = async () => {
    const toSave = parsed.filter((_, i) => selected.has(i))
    if (!toSave.length) { setError('Select at least one match'); return }
    setState('saving')
    try {
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toSave),
      })
      if (!res.ok) throw new Error('Save failed')
      setSavedCount(toSave.length)
      setState('done')
    } catch (err: any) {
      setError(err.message)
      setState('review')
    }
  }

  const reset = () => {
    setState('idle'); setText(''); setFile(null); setPreview(null)
    setParsed([]); setSelected(new Set()); setError(''); setSavedCount(0)
  }

  const updateMatch = (i: number, field: string, value: string) => {
    setParsed(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: value } : m))
  }

  const inp: React.CSSProperties = { width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 8px', fontSize: '0.8125rem', color: 'var(--text-primary)', outline: 'none', fontFamily: 'var(--font-sans)' }
  const sel: React.CSSProperties = { ...inp, cursor: 'pointer' }

  if (state === 'done') {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 48 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <p style={{ fontWeight: 700, fontSize: '1.25rem', marginBottom: 8 }}>{savedCount} match{savedCount !== 1 ? 'es' : ''} saved!</p>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>They now appear in your match history and stats.</p>
        <button onClick={reset} style={{ background: 'var(--gold)', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontWeight: 700, fontSize: '0.9375rem', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
          Import More
        </button>
      </div>
    )
  }

  if (state === 'review' || state === 'saving') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p className="heading-2">Review Parsed Matches</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
              {parsed.length} found · {selected.size} selected · Edit any field before saving
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setSelected(new Set(parsed.map((_, i) => i)))} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 7, padding: '6px 12px', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'var(--font-sans)', color: 'var(--text-secondary)' }}>All</button>
            <button onClick={() => setSelected(new Set())} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 7, padding: '6px 12px', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'var(--font-sans)', color: 'var(--text-secondary)' }}>None</button>
            <button onClick={reset} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 7, padding: '6px 12px', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'var(--font-sans)', color: 'var(--text-secondary)' }}>← Back</button>
          </div>
        </div>

        {parsed.map((m, i) => {
          const isSelected = selected.has(i)
          return (
            <div key={i} style={{ border: `1.5px solid ${isSelected ? 'var(--gold-border)' : 'var(--border)'}`, borderRadius: 12, padding: 16, background: isSelected ? 'var(--gold-light)' : 'var(--surface-2)', transition: 'all 0.15s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <input type="checkbox" checked={isSelected} onChange={e => { const s = new Set(selected); e.target.checked ? s.add(i) : s.delete(i); setSelected(s) }} style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--gold)' }} />
                <span className={`badge ${m.result === 'Win' ? 'badge-win' : 'badge-loss'}`}>{m.result}</span>
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{m.opponent || '—'}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{m.method}</span>
                {m.medal && m.medal !== 'null' && <span style={{ fontSize: '0.8rem' }}>{m.medal === 'Gold' ? '🥇' : m.medal === 'Silver' ? '🥈' : m.medal === 'Bronze' ? '🥉' : m.medal}</span>}
              </div>
              {isSelected && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
                  {[
                    { field: 'date', label: 'Date', type: 'date' },
                    { field: 'tournament', label: 'Tournament', type: 'text' },
                    { field: 'organization', label: 'Org', type: 'text' },
                    { field: 'opponent', label: 'Opponent', type: 'text' },
                  ].map(({ field, label, type }) => (
                    <div key={field}>
                      <p style={{ fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 3 }}>{label}</p>
                      <input type={type} style={{ ...inp, background: '#fff' }} value={(m as any)[field] || ''} onChange={e => updateMatch(i, field, e.target.value)} />
                    </div>
                  ))}
                  {[
                    { field: 'result', opts: ['Win', 'Loss'] },
                    { field: 'belt', opts: ['White','Blue','Purple','Brown','Black'] },
                    { field: 'gi_nogi', opts: ['Gi','No Gi','Suit'] },
                    { field: 'method', opts: ['Submission','Points','Heel Hook','Armbar','Triangle','Kimura','Overtime','Ref Decision','Tie Breaker','Disqualification','Other'] },
                    { field: 'medal', opts: ['','Gold','Silver','Bronze','5th','7th'] },
                    { field: 'division_type', opts: ['Regular','Challenger','Challenger I','Round Robin','Intermediate'] },
                  ].map(({ field, opts }) => (
                    <div key={field}>
                      <p style={{ fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 3 }}>{field.replace('_', ' ')}</p>
                      <select style={{ ...sel, background: '#fff' }} value={(m as any)[field] || ''} onChange={e => updateMatch(i, field, e.target.value)}>
                        {opts.map(o => <option key={o} value={o}>{o || 'None'}</option>)}
                      </select>
                    </div>
                  ))}
                  <div>
                    <p style={{ fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 3 }}>Score</p>
                    <input style={{ ...inp, background: '#fff' }} value={(m as any).score || ''} onChange={e => updateMatch(i, 'score', e.target.value)} placeholder="5–2" />
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {error && <p style={{ color: 'var(--loss)', fontSize: '0.875rem' }}>{error}</p>}

        <button onClick={handleSave} disabled={state === 'saving' || selected.size === 0} style={{ padding: '14px', borderRadius: 10, fontWeight: 700, fontSize: '0.9375rem', cursor: state === 'saving' || selected.size === 0 ? 'default' : 'pointer', border: 'none', fontFamily: 'var(--font-sans)', background: 'var(--gold)', color: '#fff', opacity: state === 'saving' || selected.size === 0 ? 0.6 : 1 }}>
          {state === 'saving' ? 'Saving…' : `Save ${selected.size} Match${selected.size !== 1 ? 'es' : ''}`}
        </button>
      </div>
    )
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ background: 'linear-gradient(135deg, #fdf8f0, #f7f3ff)', border: '1px solid var(--gold-border)', borderRadius: 12, padding: '16px 20px' }}>
        <p style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 4 }}>✨ AI Match Import</p>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Paste text, upload a CSV/spreadsheet, or drop a photo/screenshot of your results. Claude will extract and structure all the match data automatically.
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
        style={{ border: `2px dashed ${dragging ? 'var(--gold)' : 'var(--border)'}`, borderRadius: 12, padding: 28, textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s', background: dragging ? 'var(--gold-light)' : 'var(--surface-2)' }}
      >
        <input ref={fileRef} type="file" style={{ display: 'none' }} accept="image/*,.csv,.xlsx,.xls,.txt,.pdf" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
        {preview ? (
          <div>
            <img src={preview} alt="Preview" style={{ maxHeight: 160, maxWidth: '100%', borderRadius: 8, objectFit: 'contain', marginBottom: 8 }} />
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Click to change image</p>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 36, marginBottom: 8 }}>📎</div>
            <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Drop file here or click to upload</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Photo, screenshot, CSV, Excel, PDF, or text file</p>
          </>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>OR PASTE TEXT</span>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      </div>

      <div>
        <textarea
          placeholder={`Paste anything — tournament results, bracket screenshots text, your notes, a CSV export, etc.\n\nExamples:\n• "AGF Missouri State 2026 — Won by submission over John Smith, lost to Mike Jones on points. Got silver."\n• Paste a CSV or spreadsheet content\n• Copy/paste from a tournament results page`}
          value={text}
          onChange={e => setText(e.target.value)}
          style={{ width: '100%', minHeight: 160, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: 14, fontSize: '0.875rem', color: 'var(--text-primary)', outline: 'none', fontFamily: 'var(--font-sans)', resize: 'vertical', lineHeight: 1.6 }}
        />
      </div>

      {error && <p style={{ color: 'var(--loss)', fontSize: '0.875rem' }}>{error}</p>}

      <button
        onClick={handleParse}
        disabled={state === 'parsing' || (!text.trim() && !preview)}
        style={{ padding: '14px', borderRadius: 10, fontWeight: 700, fontSize: '0.9375rem', cursor: state === 'parsing' || (!text.trim() && !preview) ? 'default' : 'pointer', border: 'none', fontFamily: 'var(--font-sans)', background: 'var(--text-primary)', color: '#fff', opacity: state === 'parsing' || (!text.trim() && !preview) ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
      >
        {state === 'parsing' ? (
          <>
            <span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            Analyzing with AI…
          </>
        ) : '✨ Parse with AI'}
      </button>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
