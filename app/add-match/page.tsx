'use client'
import { useState } from 'react'
import { CheckCircle } from 'lucide-react'

const defaultForm = {
  date: new Date().toISOString().slice(0, 10),
  tournament: '', organization: 'AGF', belt: 'Purple',
  age_division: 'Master 1 (30+)', weight_class: 'Light (175)',
  gi_nogi: 'Gi', division_type: 'Regular',
  opponent: '', result: 'Win', method: 'Submission',
  score: '', medal: '',
}

export default function AddMatchPage() {
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

  return (
    <div style={{ paddingTop: 8, maxWidth: 640, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <p className="label" style={{ marginBottom: 4 }}>Log Result</p>
        <h1 className="heading-1">Add Match</h1>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Tournament */}
        <div>
          <p className="label" style={{ marginBottom: 12, color: 'var(--gold)', borderBottom: '1px solid var(--gold-border)', paddingBottom: 6 }}>Tournament</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <p className="label" style={{ marginBottom: 6 }}>Date</p>
              <input type="date" style={inp} value={form.date} onChange={e => set('date', e.target.value)} />
            </div>
            <div>
              <p className="label" style={{ marginBottom: 6 }}>Organization</p>
              <select style={sel} value={form.organization} onChange={e => set('organization', e.target.value)}>
                {['AGF','IBJJF','Springfield BJJ','Newbreed','Chewjitsu','Grappling Industries','Fuji BJJ','JJ Outlet','Other'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div>
            <p className="label" style={{ marginBottom: 6 }}>Tournament Name</p>
            <input style={inp} placeholder="e.g. 2026 AGF Missouri State Championships" value={form.tournament} onChange={e => set('tournament', e.target.value)} />
          </div>
        </div>

        {/* Division */}
        <div>
          <p className="label" style={{ marginBottom: 12, color: 'var(--blue)', borderBottom: '1px solid var(--blue-bg)', paddingBottom: 6 }}>Division</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <p className="label" style={{ marginBottom: 6 }}>Belt</p>
              <select style={sel} value={form.belt} onChange={e => set('belt', e.target.value)}>
                {['White','Blue','Purple','Brown','Black'].map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <p className="label" style={{ marginBottom: 6 }}>Gi / No Gi</p>
              <select style={sel} value={form.gi_nogi} onChange={e => set('gi_nogi', e.target.value)}>
                <option>Gi</option><option>No Gi</option><option>Suit</option>
              </select>
            </div>
            <div>
              <p className="label" style={{ marginBottom: 6 }}>Age Division</p>
              <select style={sel} value={form.age_division} onChange={e => set('age_division', e.target.value)}>
                {['Adult (18+)','Master 1 (30+)','Master 2 (35+)','Senior 1 (40+)','Masters'].map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <p className="label" style={{ marginBottom: 6 }}>Weight Class</p>
              <select style={sel} value={form.weight_class} onChange={e => set('weight_class', e.target.value)}>
                {['Light (175)','Challenger I (175)','Middleweight (175-200)','Middle (190)','Heavy (220)','Medium Heavy (205)'].map(w => <option key={w}>{w}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <p className="label" style={{ marginBottom: 6 }}>Division Type</p>
              <select style={sel} value={form.division_type} onChange={e => set('division_type', e.target.value)}>
                {['Regular','Challenger','Challenger I','Round Robin','Intermediate'].map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Result */}
        <div>
          <p className="label" style={{ marginBottom: 12, color: 'var(--win)', borderBottom: '1px solid var(--win-bg)', paddingBottom: 6 }}>Result</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <p className="label" style={{ marginBottom: 6 }}>Opponent</p>
              <input style={inp} placeholder="Opponent full name" value={form.opponent} onChange={e => set('opponent', e.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <p className="label" style={{ marginBottom: 6 }}>Result</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['Win','Loss'].map(r => (
                    <button key={r} onClick={() => set('result', r)} style={{
                      flex: 1, padding: '10px', borderRadius: 8, fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'var(--font-sans)',
                      background: form.result === r ? (r === 'Win' ? 'var(--win-bg)' : 'var(--loss-bg)') : 'var(--bg)',
                      color: form.result === r ? (r === 'Win' ? 'var(--win)' : 'var(--loss)') : 'var(--text-muted)',
                      border: form.result === r ? (r === 'Win' ? '1.5px solid var(--win)' : '1.5px solid var(--loss)') : '1px solid var(--border)',
                    }}>{r}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="label" style={{ marginBottom: 6 }}>Method</p>
                <select style={sel} value={form.method} onChange={e => set('method', e.target.value)}>
                  {['Submission','Points','Heel Hook','Armbar','Triangle','Kimura','Guillotine','Rear Naked Choke','Overtime','Ref Decision','Tie Breaker','Disqualification','Walkover','Other'].map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <p className="label" style={{ marginBottom: 6 }}>Score (optional)</p>
                <input style={inp} placeholder="e.g. 5–2" value={form.score} onChange={e => set('score', e.target.value)} />
              </div>
              <div>
                <p className="label" style={{ marginBottom: 6 }}>Medal</p>
                <select style={sel} value={form.medal} onChange={e => set('medal', e.target.value)}>
                  <option value="">None</option>
                  <option>Gold</option><option>Silver</option><option>Bronze</option><option>5th</option><option>7th</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {error && <p style={{ color: 'var(--loss)', fontSize: '0.875rem' }}>{error}</p>}

        <button onClick={handleSubmit} disabled={saving || saved} style={{
          width: '100%', padding: '14px', borderRadius: 10, fontWeight: 700, fontSize: '0.9375rem', cursor: saving || saved ? 'default' : 'pointer', border: 'none', transition: 'all 0.15s', fontFamily: 'var(--font-sans)',
          background: saved ? 'var(--win-bg)' : 'var(--gold)',
          color: saved ? 'var(--win)' : '#fff',
          opacity: saving ? 0.7 : 1,
        }}>
          {saved ? '✓ Match Saved!' : saving ? 'Saving...' : 'Save Match'}
        </button>
      </div>
    </div>
  )
}
