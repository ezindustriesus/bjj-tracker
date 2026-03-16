'use client'
import { useState } from 'react'
import { Match } from '@/lib/supabase'

interface Props {
  match: Match
  onSave: (updated: Match) => void
  onClose: () => void
}

export default function EditMatchModal({ match, onSave, onClose }: Props) {
  const [form, setForm] = useState({ ...match })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (field: string, value: string | null) => setForm((f: Match) => ({ ...f, [field]: value }))

  const handleSave = async () => {
    setSaving(true); setError('')
    try {
      const res = await fetch(`/api/matches/${match.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Failed')
      const updated = await res.json()
      onSave(updated)
    } catch { setError('Failed to save. Try again.') }
    finally { setSaving(false) }
  }

  const inp: React.CSSProperties = { width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px', fontSize: '0.875rem', color: 'var(--text-primary)', outline: 'none', fontFamily: 'var(--font-sans)' }
  const sel: React.CSSProperties = { ...inp, cursor: 'pointer' }
  const lbl: React.CSSProperties = { fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,23,20,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <p style={{ fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Editing</p>
            <p style={{ fontWeight: 700, fontSize: '1.125rem', letterSpacing: '-0.02em', marginTop: 2 }}>{match.opponent === 'Unknown' ? 'Unknown Opponent' : match.opponent}</p>
          </div>
          <button onClick={onClose} style={{ background: 'var(--surface-2)', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={lbl}>Date</label><input type="date" style={inp} value={form.date?.toString().slice(0,10) || ''} onChange={e => set('date', e.target.value)} /></div>
            <div><label style={lbl}>Organization</label>
              <select style={sel} value={form.organization || ''} onChange={e => set('organization', e.target.value)}>
                {['AGF','IBJJF','Springfield BJJ','Newbreed','Chewjitsu','Grappling Industries','Fuji BJJ','JJ Outlet','Other'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div><label style={lbl}>Tournament</label><input style={inp} value={form.tournament || ''} onChange={e => set('tournament', e.target.value)} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div><label style={lbl}>Belt</label>
              <select style={sel} value={form.belt || ''} onChange={e => set('belt', e.target.value)}>
                {['White','Blue','Purple','Brown','Black'].map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div><label style={lbl}>Gi / No Gi</label>
              <select style={sel} value={form.gi_nogi || ''} onChange={e => set('gi_nogi', e.target.value)}>
                <option>Gi</option><option>No Gi</option><option>Suit</option>
              </select>
            </div>
            <div><label style={lbl}>Division Type</label>
              <select style={sel} value={form.division_type || ''} onChange={e => set('division_type', e.target.value)}>
                {['Regular','Challenger','Challenger I','Round Robin','Intermediate'].map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={lbl}>Age Division</label>
              <select style={sel} value={form.age_division || ''} onChange={e => set('age_division', e.target.value)}>
                {['Adult (18+)','Master 1 (30+)','Master 2 (35+)','Senior 1 (40+)','Masters','Master (30+)'].map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div><label style={lbl}>Weight Class</label>
              <select style={sel} value={form.weight_class || ''} onChange={e => set('weight_class', e.target.value)}>
                {['Light (175)','Challenger I (175)','Middleweight (170-180)','Middleweight (175-200)','Middle (190)','Heavy (220)','Medium Heavy (205)','-185 lbs','A Weight'].map(w => <option key={w}>{w}</option>)}
              </select>
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
            <label style={lbl}>Opponent</label>
            <input style={inp} value={form.opponent || ''} onChange={e => set('opponent', e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={lbl}>Result</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['Win','Loss'].map(r => (
                  <button key={r} onClick={() => set('result', r)} style={{ flex: 1, padding: '8px', borderRadius: 8, fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'var(--font-sans)', background: form.result === r ? (r === 'Win' ? 'var(--win-bg)' : 'var(--loss-bg)') : 'var(--bg)', color: form.result === r ? (r === 'Win' ? 'var(--win)' : 'var(--loss)') : 'var(--text-muted)', border: form.result === r ? `1.5px solid ${r === 'Win' ? 'var(--win)' : 'var(--loss)'}` : '1px solid var(--border)' }}>{r}</button>
                ))}
              </div>
            </div>
            <div><label style={lbl}>Method</label>
              <select style={sel} value={form.method || ''} onChange={e => set('method', e.target.value)}>
                {['Submission','Points','Heel Hook','Armbar','Triangle','Kimura','Guillotine','Rear Naked Choke','Overtime','Ref Decision','Tie Breaker','Disqualification','Walkover','Arm Triangle','Kill Shot (OT)','Other'].map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={lbl}>Score</label><input style={inp} placeholder="e.g. 5–2" value={form.score || ''} onChange={e => set('score', e.target.value || null)} /></div>
            <div><label style={lbl}>Medal</label>
              <select style={sel} value={form.medal || ''} onChange={e => set('medal', e.target.value || null)}>
                <option value="">None</option><option>Gold</option><option>Silver</option><option>Bronze</option><option>5th</option><option>7th</option>
              </select>
            </div>
          </div>
          {error && <p style={{ color: 'var(--loss)', fontSize: '0.875rem' }}>{error}</p>}
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button onClick={onClose} style={{ flex: 1, padding: '11px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'var(--font-sans)', color: 'var(--text-secondary)' }}>Cancel</button>
            <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: '11px', background: 'var(--gold)', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '0.9375rem', cursor: saving ? 'default' : 'pointer', fontFamily: 'var(--font-sans)', color: '#fff', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
