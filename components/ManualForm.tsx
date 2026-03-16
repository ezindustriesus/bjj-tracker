'use client'
import { useState } from 'react'

const defaultForm = {
  date: new Date().toISOString().slice(0, 10),
  tournament: '', organization: 'AGF', belt: 'Purple',
  age_division: 'Master 1 (30+)', weight_class: 'Light (175)',
  gi_nogi: 'Gi', division_type: 'Regular',
  opponent: '', result: 'Win', method: 'Submission',
  score: '', medal: '',
}

export default function ManualForm() {
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }))

  const handleSubmit = async () => {
    if (!form.tournament || !form.opponent) { setError('Tournament and opponent are required'); return }
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, score: form.score || null, medal: form.medal || null }),
      })
      if (!res.ok) throw new Error('Failed')
      setSaved(true)
      setTimeout(() => { setSaved(false); setForm(f => ({ ...f, opponent: '', score: '', medal: '' })) }, 2500)
    } catch { setError('Failed to save. Try again.') }
    finally { setSaving(false) }
  }

  const inp: React.CSSProperties = { width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: '0.875rem', color: 'var(--text-primary)', outline: 'none', fontFamily: 'var(--font-sans)' }
  const sel: React.CSSProperties = { ...inp, cursor: 'pointer' }
  const lbl: React.CSSProperties = { fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }
  const section = (color: string, border: string): React.CSSProperties => ({ borderTop: `2px solid ${border}`, paddingTop: 16, marginTop: 4 })

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Tournament */}
      <div>
        <p style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--gold)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tournament</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div><label style={lbl}>Date</label><input type="date" style={inp} value={form.date} onChange={e => set('date', e.target.value)} /></div>
          <div><label style={lbl}>Organization</label>
            <select style={sel} value={form.organization} onChange={e => set('organization', e.target.value)}>
              {['AGF','IBJJF','Springfield BJJ','Newbreed','Chewjitsu','Grappling Industries','Fuji BJJ','JJ Outlet','Other'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>
        <div><label style={lbl}>Tournament Name</label><input style={inp} placeholder="e.g. 2026 AGF Missouri State Championships" value={form.tournament} onChange={e => set('tournament', e.target.value)} /></div>
      </div>

      {/* Division */}
      <div style={section('var(--blue)', 'var(--blue-bg)')}>
        <p style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--blue)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Division</p>
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
          <div style={{ gridColumn: 'span 2' }}><label style={lbl}>Division Type</label>
            <select style={sel} value={form.division_type} onChange={e => set('division_type', e.target.value)}>
              {['Regular','Challenger','Challenger I','Round Robin','Intermediate'].map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Result */}
      <div style={section('var(--win)', 'var(--win-bg)')}>
        <p style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--win)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Result</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div><label style={lbl}>Opponent</label><input style={inp} placeholder="Full name" value={form.opponent} onChange={e => set('opponent', e.target.value)} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={lbl}>Result</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['Win','Loss'].map(r => (
                  <button key={r} onClick={() => set('result', r)} style={{ flex: 1, padding: '10px', borderRadius: 8, fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 0.1s', background: form.result === r ? (r === 'Win' ? 'var(--win-bg)' : 'var(--loss-bg)') : 'var(--bg)', color: form.result === r ? (r === 'Win' ? 'var(--win)' : 'var(--loss)') : 'var(--text-muted)', border: form.result === r ? `1.5px solid ${r === 'Win' ? 'var(--win)' : 'var(--loss)'}` : '1px solid var(--border)' }}>{r}</button>
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
                <option value="">None</option><option>Gold</option><option>Silver</option><option>Bronze</option><option>5th</option><option>7th</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {error && <p style={{ color: 'var(--loss)', fontSize: '0.875rem' }}>{error}</p>}
      <button onClick={handleSubmit} disabled={saving || saved} style={{ width: '100%', padding: '14px', borderRadius: 10, fontWeight: 700, fontSize: '0.9375rem', cursor: saving || saved ? 'default' : 'pointer', border: 'none', fontFamily: 'var(--font-sans)', background: saved ? 'var(--win-bg)' : 'var(--gold)', color: saved ? 'var(--win)' : '#fff', opacity: saving ? 0.7 : 1 }}>
        {saved ? '✓ Match Saved!' : saving ? 'Saving…' : 'Save Match'}
      </button>
    </div>
  )
}
