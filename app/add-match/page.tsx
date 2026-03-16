'use client'
import { useState, useRef } from 'react'
import { Upload, Sparkles, ChevronDown, ChevronUp } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const defaultForm = {
  date: new Date().toISOString().slice(0, 10),
  tournament: '', organization: 'AGF', belt: 'Purple',
  age_division: 'Master 1 (30+)', weight_class: 'Light (175)',
  gi_nogi: 'Gi', division_type: 'Regular',
  opponent: '', result: 'Win' as 'Win' | 'Loss', method: 'Submission',
  score: '', medal: '',
}
type FormData = typeof defaultForm

function MatchForm({ form, setForm, onSave, saving, saved }: {
  form: FormData; setForm: (f: FormData) => void
  onSave: () => void; saving: boolean; saved: boolean
}) {
  const set = (k: string, v: string) => setForm({ ...form, [k]: v } as FormData)
  const inp: React.CSSProperties = { width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: '0.875rem', color: 'var(--text-primary)', outline: 'none', fontFamily: 'var(--font-sans)' }
  const sel: React.CSSProperties = { ...inp, cursor: 'pointer' }
  const lbl: React.CSSProperties = { fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase' as const, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div><label style={lbl}>Date</label><input type="date" style={inp} value={form.date} onChange={e => set('date', e.target.value)} /></div>
        <div><label style={lbl}>Organization</label>
          <select style={sel} value={form.organization} onChange={e => set('organization', e.target.value)}>
            {['AGF','IBJJF','Springfield BJJ','Newbreed','Chewjitsu','Grappling Industries','Fuji BJJ','JJ Outlet','Other'].map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
      </div>
      <div><label style={lbl}>Tournament Name</label><input style={inp} placeholder="e.g. 2026 AGF Missouri State Championships" value={form.tournament} onChange={e => set('tournament', e.target.value)} /></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div><label style={lbl}>Belt</label>
          <select style={sel} value={form.belt} onChange={e => set('belt', e.target.value)}>
            {['White','Blue','Purple','Brown','Black'].map(b => <option key={b}>{b}</option>)}
          </select>
        </div>
        <div><label style={lbl}>Gi / No Gi</label>
          <select style={sel} value={form.gi_nogi} onChange={e => set('gi_nogi', e.target.value)}>
            <option>Gi</option><option>No Gi</option><option>Suit</option>
          </select>
        </div>
        <div><label style={lbl}>Age Division</label>
          <select style={sel} value={form.age_division} onChange={e => set('age_division', e.target.value)}>
            {['Adult (18+)','Master 1 (30+)','Master 2 (35+)','Senior 1 (40+)','Masters'].map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div><label style={lbl}>Weight Class</label>
          <select style={sel} value={form.weight_class} onChange={e => set('weight_class', e.target.value)}>
            {['Light (175)','Challenger I (175)','Middleweight (175-200)','Middle (190)','Heavy (220)','Medium Heavy (205)'].map(w => <option key={w}>{w}</option>)}
          </select>
        </div>
      </div>
      <div><label style={lbl}>Division Type</label>
        <select style={sel} value={form.division_type} onChange={e => set('division_type', e.target.value)}>
          {['Regular','Challenger','Challenger I','Round Robin','Intermediate'].map(d => <option key={d}>{d}</option>)}
        </select>
      </div>
      <div><label style={lbl}>Opponent</label><input style={inp} placeholder="Full name" value={form.opponent} onChange={e => set('opponent', e.target.value)} /></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div><label style={lbl}>Result</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['Win','Loss'] as const).map(r => (
              <button key={r} onClick={() => set('result', r)} style={{ flex: 1, padding: '10px', borderRadius: 8, fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 0.15s', background: form.result === r ? (r === 'Win' ? 'var(--win-bg)' : 'var(--loss-bg)') : 'var(--bg)', color: form.result === r ? (r === 'Win' ? 'var(--win)' : 'var(--loss)') : 'var(--text-muted)', border: form.result === r ? `1.5px solid var(--${r === 'Win' ? 'win' : 'loss'})` : '1px solid var(--border)' }}>{r}</button>
            ))}
          </div>
        </div>
        <div><label style={lbl}>Method</label>
          <select style={sel} value={form.method} onChange={e => set('method', e.target.value)}>
            {['Submission','Points','Heel Hook','Armbar','Triangle','Kimura','Guillotine','Rear Naked Choke','Overtime','Ref Decision','Tie Breaker','Disqualification','Walkover','Other'].map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div><label style={lbl}>Score (optional)</label><input style={inp} placeholder="e.g. 5–2" value={form.score} onChange={e => set('score', e.target.value)} /></div>
        <div><label style={lbl}>Medal</label>
          <select style={sel} value={form.medal} onChange={e => set('medal', e.target.value)}>
            <option value="">None</option>
            {['Gold','Silver','Bronze','5th','7th'].map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
      </div>
      <button onClick={onSave} disabled={saving || saved} style={{ width: '100%', padding: '14px', borderRadius: 10, fontWeight: 700, fontSize: '0.9375rem', cursor: saving || saved ? 'default' : 'pointer', border: 'none', fontFamily: 'var(--font-sans)', transition: 'all 0.15s', background: saved ? 'var(--win-bg)' : 'var(--gold)', color: saved ? 'var(--win)' : '#fff', opacity: saving ? 0.7 : 1 }}>
        {saved ? '✓ Match Saved!' : saving ? 'Saving...' : 'Save Match'}
      </button>
    </div>
  )
}

function AIEntry({ onParsed }: { onParsed: (matches: FormData[]) => void }) {
  const [text, setText] = useState('')
  const [parsing, setParsing] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')
  const [fileName, setFileName] = useState('')
  const [imageData, setImageData] = useState<{ base64: string; type: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    setFileName(file.name); setError('')
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = e => { const b64 = (e.target?.result as string).split(',')[1]; setImageData({ base64: b64, type: file.type }); setText('') }
      reader.readAsDataURL(file); return
    }
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) { setError('Export as CSV first, then upload.'); return }
    const reader = new FileReader()
    reader.onload = e => { setText(e.target?.result as string || ''); setImageData(null) }
    reader.readAsText(file)
  }

  const handleParse = async () => {
    if (!text.trim() && !imageData) { setError('Add text or upload a file first.'); return }
    setParsing(true); setError('')
    try {
      const res = await fetch('/api/ai-parse', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: text || undefined, imageBase64: imageData?.base64, imageType: imageData?.type }) })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Parse failed')
      if (!data.matches?.length) throw new Error('No matches found. Try adding more detail.')
      onParsed(data.matches.map((m: any) => ({ date: m.date || new Date().toISOString().slice(0,10), tournament: m.tournament || '', organization: m.organization || 'AGF', belt: m.belt || 'Purple', age_division: m.age_division || 'Master 1 (30+)', weight_class: m.weight_class || 'Light (175)', gi_nogi: m.gi_nogi || 'Gi', division_type: m.division_type || 'Regular', opponent: m.opponent || '', result: m.result === 'Loss' ? 'Loss' : 'Win', method: m.method || 'Submission', score: m.score || '', medal: m.medal || '' })))
    } catch (e: any) { setError(e.message) }
    finally { setParsing(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: 'var(--gold-light)', border: '1px solid var(--gold-border)', borderRadius: 10, padding: '14px 16px' }}>
        <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--gold)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}><Sparkles size={15} /> AI Match Entry</p>
        <p style={{ fontSize: '0.8125rem', color: '#7a5c20', lineHeight: 1.5 }}>Paste text, upload a screenshot, photo, CSV, or bracket image. Claude parses it and pre-fills the form.</p>
      </div>
      <div onDragOver={e => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)} onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }} onClick={() => fileRef.current?.click()}
        style={{ border: `2px dashed ${dragOver ? 'var(--gold)' : 'var(--border)'}`, borderRadius: 10, padding: '28px 20px', textAlign: 'center', cursor: 'pointer', background: dragOver ? 'var(--gold-light)' : 'var(--bg)', transition: 'all 0.15s' }}>
        <input ref={fileRef} type="file" style={{ display: 'none' }} accept="image/*,.csv,.txt,.pdf" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
        {fileName ? (
          <div><p style={{ fontWeight: 600, fontSize: '0.875rem' }}>📎 {fileName}</p><button onClick={e => { e.stopPropagation(); setFileName(''); setImageData(null); setText('') }} style={{ marginTop: 8, background: 'none', border: 'none', color: 'var(--gold)', fontSize: '0.8125rem', cursor: 'pointer', fontWeight: 600 }}>Remove</button></div>
        ) : (
          <div><Upload size={24} style={{ color: 'var(--text-muted)', marginBottom: 8 }} /><p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 2 }}>Drop a file or click to upload</p><p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Photo · Screenshot · CSV · PDF</p></div>
        )}
      </div>
      <textarea value={text} onChange={e => { setText(e.target.value); setFileName(''); setImageData(null) }} placeholder={'Paste anything — tournament results, bracket info, notes...'} style={{ width: '100%', minHeight: 120, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px', fontSize: '0.875rem', color: 'var(--text-primary)', outline: 'none', fontFamily: 'var(--font-sans)', resize: 'vertical', lineHeight: 1.5 }} />
      {error && <p style={{ color: 'var(--loss)', fontSize: '0.875rem', background: 'var(--loss-bg)', padding: '10px 12px', borderRadius: 8 }}>{error}</p>}
      <button onClick={handleParse} disabled={parsing || (!text.trim() && !imageData)} style={{ width: '100%', padding: '13px', borderRadius: 10, fontWeight: 700, fontSize: '0.9375rem', cursor: 'pointer', border: 'none', fontFamily: 'var(--font-sans)', background: 'var(--text-primary)', color: '#fff', opacity: parsing || (!text.trim() && !imageData) ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <Sparkles size={16} />{parsing ? 'Parsing with AI...' : 'Parse with AI'}
      </button>
    </div>
  )
}

function ParsedReview({ matches, onBack, onSaved }: { matches: FormData[], onBack: () => void, onSaved: () => void }) {
  const [forms, setForms] = useState(matches)
  const [expanded, setExpanded] = useState<number>(0)
  const [saving, setSaving] = useState(false)
  const [savedIds, setSavedIds] = useState<number[]>([])
  const [error, setError] = useState('')

  const saveOne = async (i: number) => {
    setSaving(true); setError('')
    try {
      const form = forms[i]
      if (!form.tournament || !form.opponent) { setError('Tournament and opponent required'); setSaving(false); return }
      const res = await fetch('/api/matches', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, score: form.score || null, medal: form.medal || null }) })
      if (!res.ok) throw new Error('Save failed')
      setSavedIds(s => [...s, i])
    } catch { setError('Failed to save.') }
    finally { setSaving(false) }
  }

  const saveAll = async () => { for (let i = 0; i < forms.length; i++) { if (!savedIds.includes(i)) await saveOne(i) } }
  const allSaved = savedIds.length === forms.length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><p style={{ fontWeight: 700, fontSize: '1rem' }}>Review {forms.length} parsed match{forms.length !== 1 ? 'es' : ''}</p><p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 2 }}>Edit any field before saving</p></div>
        <button onClick={onBack} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 7, padding: '6px 12px', cursor: 'pointer', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>← Back</button>
      </div>
      {forms.map((form, i) => (
        <div key={i} className="card-sm" style={{ border: `1px solid ${savedIds.includes(i) ? 'var(--win)' : 'var(--border)'}`, background: savedIds.includes(i) ? 'var(--win-bg)' : '#fff', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setExpanded(expanded === i ? -1 : i)}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className={`badge ${form.result === 'Win' ? 'badge-win' : 'badge-loss'}`}>{form.result}</span>
                <span style={{ fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{form.opponent || 'Unknown'}</span>
                {savedIds.includes(i) && <span style={{ color: 'var(--win)', fontSize: '0.8rem' }}>✓ Saved</span>}
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{form.tournament || 'No tournament'} · {form.method}</p>
            </div>
            {!savedIds.includes(i) && (expanded === i ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />)}
          </div>
          {expanded === i && !savedIds.includes(i) && (
            <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <MatchForm form={form} setForm={f => setForms(fs => fs.map((x, j) => j === i ? f : x))} onSave={() => saveOne(i)} saving={saving} saved={savedIds.includes(i)} />
            </div>
          )}
        </div>
      ))}
      {error && <p style={{ color: 'var(--loss)', fontSize: '0.875rem' }}>{error}</p>}
      {!allSaved && forms.length > 1 && <button onClick={saveAll} disabled={saving} style={{ width: '100%', padding: '13px', borderRadius: 10, fontWeight: 700, fontSize: '0.9375rem', cursor: 'pointer', border: 'none', fontFamily: 'var(--font-sans)', background: 'var(--gold)', color: '#fff', opacity: saving ? 0.7 : 1 }}>Save All {forms.length - savedIds.length} Remaining</button>}
      {allSaved && <button onClick={onSaved} style={{ width: '100%', padding: '13px', borderRadius: 10, fontWeight: 700, fontSize: '0.9375rem', cursor: 'pointer', border: 'none', fontFamily: 'var(--font-sans)', background: 'var(--win-bg)', color: 'var(--win)' }}>✓ All saved — Add more</button>}
    </div>
  )
}

export default function AddMatchPage() {
  const [tab, setTab] = useState<'manual' | 'ai'>('manual')
  const [form, setForm] = useState<FormData>(defaultForm)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [parsedMatches, setParsedMatches] = useState<FormData[] | null>(null)
  const { isAdmin, loading } = useAuth()
  const router = useRouter()

  useEffect(() => { if (!loading && !isAdmin) router.push('/') }, [loading, isAdmin, router])

  const handleManualSave = async () => {
    if (!form.tournament || !form.opponent) { setError('Tournament and opponent are required'); return }
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/matches', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, score: form.score || null, medal: form.medal || null }) })
      if (!res.ok) throw new Error('Failed')
      setSaved(true)
      setTimeout(() => { setSaved(false); setForm(f => ({ ...f, opponent: '', score: '', medal: '' })) }, 2500)
    } catch { setError('Failed to save. Try again.') }
    finally { setSaving(false) }
  }

  if (loading) return null

  const tabBtn = (t: 'manual' | 'ai'): React.CSSProperties => ({ padding: '8px 18px', borderRadius: 7, fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', border: 'none', background: tab === t ? (t === 'ai' ? 'var(--text-primary)' : 'var(--gold)') : 'transparent', color: tab === t ? '#fff' : 'var(--text-muted)', fontFamily: 'var(--font-sans)', transition: 'all 0.15s' })

  return (
    <div style={{ paddingTop: 8, maxWidth: 620, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}><p className="label" style={{ marginBottom: 4 }}>Log Result</p><h1 className="heading-1">Add Match</h1></div>
      {!parsedMatches && (
        <div style={{ display: 'inline-flex', background: 'var(--surface-2)', borderRadius: 9, padding: 3, gap: 2, marginBottom: 20 }}>
          <button style={tabBtn('manual')} onClick={() => setTab('manual')}>Manual Entry</button>
          <button style={tabBtn('ai')} onClick={() => setTab('ai')}><span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Sparkles size={14} /> AI Entry</span></button>
        </div>
      )}
      <div className="card">
        {parsedMatches ? (
          <ParsedReview matches={parsedMatches} onBack={() => setParsedMatches(null)} onSaved={() => setParsedMatches(null)} />
        ) : tab === 'manual' ? (
          <>{error && <p style={{ color: 'var(--loss)', fontSize: '0.875rem', marginBottom: 12 }}>{error}</p>}<MatchForm form={form} setForm={setForm} onSave={handleManualSave} saving={saving} saved={saved} /></>
        ) : (
          <AIEntry onParsed={matches => setParsedMatches(matches)} />
        )}
      </div>
    </div>
  )
}
