'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle } from 'lucide-react'

const defaultForm = {
  date: new Date().toISOString().slice(0, 10),
  tournament: '',
  organization: 'AGF',
  belt: 'Purple',
  age_division: 'Master 1 (30+)',
  weight_class: 'Light (175)',
  gi_nogi: 'Gi',
  division_type: 'Regular',
  opponent: '',
  result: 'Win',
  method: 'Submission',
  score: '',
  medal: '',
}

export default function AddMatchPage() {
  const router = useRouter()
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }))

  const handleSubmit = async () => {
    if (!form.tournament || !form.opponent) {
      setError('Tournament and opponent are required')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          score: form.score || null,
          medal: form.medal || null,
        }),
      })
      if (!res.ok) throw new Error('Failed to save')
      setSaved(true)
      setTimeout(() => {
        setSaved(false)
        setForm(f => ({ ...f, opponent: '', score: '', medal: '' }))
      }, 2000)
    } catch {
      setError('Failed to save match. Try again.')
    } finally {
      setSaving(false)
    }
  }

  const inputClass = "w-full bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-yellow-500 placeholder-zinc-600"
  const selectClass = "w-full bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-yellow-500"
  const labelClass = "block text-xs text-zinc-500 uppercase tracking-wider font-medium mb-1.5"

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Add Match</h1>
        <p className="text-zinc-500 text-sm mt-1">Log a new competition result</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
        {/* Tournament info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Date</label>
            <input type="date" className={inputClass} value={form.date}
              onChange={e => set('date', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Organization</label>
            <select className={selectClass} value={form.organization} onChange={e => set('organization', e.target.value)}>
              {['AGF','IBJJF','Springfield BJJ','Newbreed','Chewjitsu','Grappling Industries','Fuji BJJ','JJ Outlet','Other'].map(o => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>Tournament Name</label>
          <input className={inputClass} placeholder="e.g. 2026 AGF Missouri State Championships"
            value={form.tournament} onChange={e => set('tournament', e.target.value)} />
        </div>

        {/* Division */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Belt</label>
            <select className={selectClass} value={form.belt} onChange={e => set('belt', e.target.value)}>
              {['White','Blue','Purple','Brown','Black'].map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Gi / No Gi</label>
            <select className={selectClass} value={form.gi_nogi} onChange={e => set('gi_nogi', e.target.value)}>
              <option>Gi</option>
              <option>No Gi</option>
              <option>Suit</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Age Division</label>
            <select className={selectClass} value={form.age_division} onChange={e => set('age_division', e.target.value)}>
              {['Adult (18+)','Master 1 (30+)','Master 2 (35+)','Senior 1 (40+)','Masters'].map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Weight Class</label>
            <select className={selectClass} value={form.weight_class} onChange={e => set('weight_class', e.target.value)}>
              {['Light (175)','Challenger I (175)','Middleweight (175-200)','Middle (190)','Heavy (220)','Medium Heavy (205)'].map(w => <option key={w}>{w}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>Division Type</label>
          <select className={selectClass} value={form.division_type} onChange={e => set('division_type', e.target.value)}>
            {['Regular','Challenger','Challenger I','Round Robin','Intermediate'].map(d => <option key={d}>{d}</option>)}
          </select>
        </div>

        {/* Match result */}
        <div className="border-t border-zinc-800 pt-4">
          <div>
            <label className={labelClass}>Opponent</label>
            <input className={inputClass} placeholder="Opponent name"
              value={form.opponent} onChange={e => set('opponent', e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Result</label>
            <div className="flex gap-2">
              {['Win','Loss'].map(r => (
                <button key={r} onClick={() => set('result', r)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    form.result === r
                      ? r === 'Win' ? 'bg-green-500/20 text-green-400 border border-green-500/40' : 'bg-red-500/20 text-red-400 border border-red-500/40'
                      : 'bg-zinc-800 text-zinc-500 border border-zinc-700 hover:bg-zinc-700'
                  }`}>
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={labelClass}>Method</label>
            <select className={selectClass} value={form.method} onChange={e => set('method', e.target.value)}>
              {['Submission','Points','Heel Hook','Armbar','Triangle','Kimura','Guillotine','Rear Naked Choke','Overtime','Ref Decision','Tie Breaker','Disqualification','Walkover','Other'].map(m => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Score (optional)</label>
            <input className={inputClass} placeholder="e.g. 5-2"
              value={form.score} onChange={e => set('score', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Medal</label>
            <select className={selectClass} value={form.medal} onChange={e => set('medal', e.target.value)}>
              <option value="">None / N/A</option>
              <option>Gold</option>
              <option>Silver</option>
              <option>Bronze</option>
              <option>5th</option>
              <option>7th</option>
            </select>
          </div>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={saving || saved}
          className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
            saved
              ? 'bg-green-500/20 text-green-400 border border-green-500/40'
              : 'bg-yellow-500 hover:bg-yellow-400 text-black disabled:opacity-50'
          }`}
        >
          {saved ? (
            <span className="flex items-center justify-center gap-2">
              <CheckCircle size={16} /> Match Saved!
            </span>
          ) : saving ? 'Saving...' : 'Save Match'}
        </button>
      </div>
    </div>
  )
}
