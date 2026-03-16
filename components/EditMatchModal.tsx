'use client'
import { useState, useEffect } from 'react'
import { Match } from '@/lib/supabase'
import { X, Trash2 } from 'lucide-react'

interface Props {
  match: Match | null
  onClose: () => void
  onSaved: (match: Match) => void
  onDeleted: (id: number) => void
}

export default function EditMatchModal({ match, onClose, onSaved, onDeleted }: Props) {
  const [form, setForm] = useState<Partial<Match>>({})
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (match) {
      setForm({ ...match })
      setConfirmDelete(false)
      setError('')
    }
  }, [match])

  if (!match) return null

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }))

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/matches/${match.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          score: form.score || null,
          medal: form.medal || null,
        }),
      })
      if (!res.ok) throw new Error('Save failed')
      const updated = await res.json()
      onSaved(updated)
    } catch {
      setError('Failed to save. Try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    try {
      const res = await fetch(`/api/matches/${match.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      onDeleted(match.id!)
    } catch {
      setError('Failed to delete.')
      setDeleting(false)
    }
  }

  const inp: React.CSSProperties = {
    width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
    borderRadius: 7, padding: '8px 10px', fontSize: '0.8125rem',
    color: 'var(--text-primary)', outline: 'none', fontFamily: 'var(--font-sans)',
  }
  const sel: React.CSSProperties = { ...inp, cursor: 'pointer' }
  const lbl: React.CSSProperties = { fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: 5 }

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 200, backdropFilter: 'blur(2px)' }} />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: 460,
        background: '#fff', zIndex: 201, overflowY: 'auto',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.12)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
          <div>
            <p style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 2 }}>Edit Match</p>
            <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>{match.opponent === 'Unknown' ? 'Unknown Opponent' : match.opponent}</p>
          </div>
          <button onClick={onClose} style={{ background: 'var(--surface-2)', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', display: 'flex' }}>
            <X size={16} color="var(--text-secondary)" />
          </button>
        </div>

        {/* Form */}
        <div style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Date</label>
              <input type="date" style={inp} value={form.date || ''} onChange={e => set('date', e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Organization</label>
              <select style={sel} value={form.organization || ''} onChange={e => set('organization', e.target.value)}>
                {['AGF','IBJJF','Springfield BJJ','Newbreed','Chewjitsu','Grappling Industries','Fuji BJJ','JJ Outlet','Other'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={lbl}>Tournament</label>
            <input style={inp} value={form.tournament || ''} onChange={e => set('tournament', e.target.value)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Belt</label>
              <select style={sel} value={form.belt || ''} onChange={e => set('belt', e.target.value)}>
                {['White','Blue','Purple','Brown','Black'].map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Gi / No Gi</label>
              <select style={sel} value={form.gi_nogi || ''} onChange={e => set('gi_nogi', e.target.value)}>
                <option>Gi</option><option>No Gi</option><option>Suit</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Age Division</label>
              <select style={sel} value={form.age_division || ''} onChange={e => set('age_division', e.target.value)}>
                {['Adult (18+)','Master 1 (30+)','Master 2 (35+)','Senior 1 (40+)','Masters'].map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Weight Class</label>
              <select style={sel} value={form.weight_class || ''} onChange={e => set('weight_class', e.target.value)}>
                {['Light (175)','Challenger I (175)','Middleweight (175-200)','Middle (190)','Heavy (220)','Medium Heavy (205)'].map(w => <option key={w}>{w}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={lbl}>Division Type</label>
            <select style={sel} value={form.division_type || ''} onChange={e => set('division_type', e.target.value)}>
              {['Regular','Challenger','Challenger I','Round Robin','Intermediate'].map(d => <option key={d}>{d}</option>)}
            </select>
          </div>

          <div>
            <label style={lbl}>Opponent</label>
            <input style={inp} value={form.opponent || ''} onChange={e => set('opponent', e.target.value)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Result</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {['Win','Loss'].map(r => (
                  <button key={r} onClick={() => set('result', r)} style={{
                    flex: 1, padding: '8px', borderRadius: 7, fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer', fontFamily: 'var(--font-sans)',
                    background: form.result === r ? (r === 'Win' ? 'var(--win-bg)' : 'var(--loss-bg)') : 'var(--bg)',
                    color: form.result === r ? (r === 'Win' ? 'var(--win)' : 'var(--loss)') : 'var(--text-muted)',
                    border: form.result === r ? (r === 'Win' ? '1.5px solid var(--win)' : '1.5px solid var(--loss)') : '1px solid var(--border)',
                    transition: 'all 0.15s',
                  }}>{r}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={lbl}>Method</label>
              <select style={sel} value={form.method || ''} onChange={e => set('method', e.target.value)}>
                {['Submission','Points','Heel Hook','Armbar','Triangle','Kimura','Guillotine','Rear Naked Choke','Overtime','Ref Decision','Tie Breaker','Disqualification','Walkover','Other'].map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Score</label>
              <input style={inp} placeholder="e.g. 5–2" value={form.score || ''} onChange={e => set('score', e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Medal</label>
              <select style={sel} value={form.medal || ''} onChange={e => set('medal', e.target.value)}>
                <option value="">None</option>
                <option>Gold</option><option>Silver</option><option>Bronze</option><option>5th</option><option>7th</option>
              </select>
            </div>
          </div>

          {error && <p style={{ color: 'var(--loss)', fontSize: '0.8125rem' }}>{error}</p>}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, background: '#fff' }}>
          <button onClick={handleDelete} disabled={deleting} style={{
            padding: '10px 16px', borderRadius: 8, fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer', fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', gap: 6,
            background: confirmDelete ? 'var(--loss-bg)' : 'transparent',
            color: confirmDelete ? 'var(--loss)' : 'var(--text-muted)',
            border: confirmDelete ? '1.5px solid var(--loss)' : '1px solid var(--border)',
            transition: 'all 0.15s',
          }}>
            <Trash2 size={14} />
            {deleting ? 'Deleting...' : confirmDelete ? 'Confirm Delete' : 'Delete'}
          </button>
          <button onClick={handleSave} disabled={saving} style={{
            flex: 1, padding: '10px', borderRadius: 8, fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'var(--font-sans)',
            background: 'var(--gold)', color: '#fff', border: 'none', opacity: saving ? 0.7 : 1, transition: 'opacity 0.15s',
          }}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </>
  )
}
