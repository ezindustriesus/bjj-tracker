'use client'
import { useEffect, useState } from 'react'
import { Sparkles, RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react'

type Insights = {
  headline: string
  overall_grade: string
  strengths: string[]
  weaknesses: string[]
  patterns: string[]
  recommendations: string[]
  rival_notes: string[]
  momentum: string
}

type Stats = {
  total: number; wins: number; losses: number; winRate: number
  recent20: { wins: number; losses: number; winRate: number }
  currentStreak: { type: string; count: number }
  subRate: number
  methods: [string, {wins:number,losses:number}][]
  byType: Record<string, {wins:number,losses:number}>
  lossMethods: [string, number][]
  repeatOpponents: [string, {wins:number,losses:number}][]
  yearlyTrend: [string, {wins:number,losses:number}][]
}

const gradeColor = (g: string) => {
  if (g?.startsWith('A')) return { bg:'#e8f5ee', color:'#1a7a4a', border:'#b8dfc8' }
  if (g?.startsWith('B')) return { bg:'#fdf3e0', color:'#c8952a', border:'#f0d9a0' }
  return { bg:'var(--loss-bg)', color:'var(--loss)', border:'#f0c0b8' }
}

const momentumIcon = (m: string) => {
  if (m?.includes('improv')) return <TrendingUp size={16} color="var(--win)"/>
  if (m?.includes('declin')) return <TrendingDown size={16} color="var(--loss)"/>
  return <Minus size={16} color="var(--text-muted)"/>
}

export default function InsightsPage() {
  const [data, setData] = useState<{ insights: Insights; stats: Stats; generatedAt: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/insights')
      if (!res.ok) throw new Error('Failed')
      setData(await res.json())
    } catch { setError('Failed to load insights. Try again.') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const Section = ({ title, items, icon, color }: { title: string; items: string[]; icon: string; color: string }) => (
    <div className="card">
      <p className="heading-2" style={{ marginBottom:14, display:'flex', alignItems:'center', gap:8 }}><span>{icon}</span>{title}</p>
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {items.map((item, i) => (
          <div key={i} style={{ display:'flex', gap:10, padding:'10px 12px', background:'var(--bg)', borderRadius:8 }}>
            <span style={{ color, fontWeight:700, flexShrink:0, marginTop:1 }}>→</span>
            <p style={{ fontSize:'0.875rem', color:'var(--text-primary)', lineHeight:1.5 }}>{item}</p>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div style={{ paddingTop:8 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <p className="label" style={{ marginBottom:4 }}>AI Analysis</p>
          <h1 className="heading-1">Performance Insights</h1>
        </div>
        <button onClick={load} disabled={loading} style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 16px', borderRadius:8, border:'1px solid var(--border)', background:'#fff', cursor:'pointer', fontWeight:600, fontSize:'0.875rem', fontFamily:'var(--font-sans)', opacity:loading?0.6:1 }}>
          <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}/> Refresh
        </button>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      {loading && !data && (
        <div style={{ textAlign:'center', padding:80 }}>
          <Sparkles size={32} color="var(--gold)" style={{ margin:'0 auto 16px', display:'block' }}/>
          <p style={{ color:'var(--text-muted)', fontSize:'0.9rem' }}>Claude is analyzing your match history...</p>
        </div>
      )}

      {error && <div style={{ padding:'16px 20px', background:'var(--loss-bg)', borderRadius:10, color:'var(--loss)', marginBottom:20 }}>{error}</div>}

      {data && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {/* Headline card */}
          <div className="card" style={{ background:'var(--text-primary)', border:'none' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:16 }}>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                  <Sparkles size={14} color="rgba(255,255,255,0.5)"/>
                  <p style={{ fontSize:'0.6875rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'rgba(255,255,255,0.5)' }}>AI Summary</p>
                </div>
                <p style={{ fontSize:'1.125rem', fontWeight:600, color:'#fff', lineHeight:1.4 }}>{data.insights.headline}</p>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:10 }}>
                  {momentumIcon(data.insights.momentum)}
                  <p style={{ fontSize:'0.8125rem', color:'rgba(255,255,255,0.65)' }}>{data.insights.momentum}</p>
                </div>
              </div>
              <div style={{ ...gradeColor(data.insights.overall_grade), borderRadius:12, padding:'12px 20px', textAlign:'center', border:`1px solid ${gradeColor(data.insights.overall_grade).border}` }}>
                <p style={{ fontSize:'0.625rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Grade</p>
                <p style={{ fontSize:'2rem', fontWeight:800, letterSpacing:'-0.03em', fontFamily:'var(--font-mono)' }}>{data.insights.overall_grade}</p>
              </div>
            </div>
          </div>

          {/* Key stats row */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:10 }}>
            {[
              { label:'Overall', value:`${data.stats.wins}–${data.stats.losses}`, sub:`${data.stats.winRate}%` },
              { label:'Last 20', value:`${data.stats.recent20.wins}–${data.stats.recent20.losses}`, sub:`${data.stats.recent20.winRate}%` },
              { label:'Streak', value:`${data.stats.currentStreak.count}`, sub:data.stats.currentStreak.type+'s' },
              { label:'Sub Rate', value:`${data.stats.subRate}%`, sub:'finish rate' },
            ].map(s => (
              <div key={s.label} className="card-sm">
                <p className="label" style={{ marginBottom:6 }}>{s.label}</p>
                <p style={{ fontSize:'1.5rem', fontWeight:700, fontFamily:'var(--font-mono)', letterSpacing:'-0.03em', lineHeight:1 }}>{s.value}</p>
                <p style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:3 }}>{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Main insights grid */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <Section title="Strengths" items={data.insights.strengths} icon="💪" color="var(--win)" />
            <Section title="Areas to Improve" items={data.insights.weaknesses} icon="🎯" color="var(--loss)" />
          </div>
          <Section title="Patterns & Trends" items={data.insights.patterns} icon="🔍" color="var(--gold)" />
          <Section title="Training Recommendations" items={data.insights.recommendations} icon="📋" color="var(--blue)" />
          {data.insights.rival_notes?.length > 0 && (
            <Section title="Rivalry Notes" items={data.insights.rival_notes} icon="👥" color="var(--text-secondary)" />
          )}

          {/* Loss methods */}
          {data.stats.lossMethods?.length > 0 && (
            <div className="card">
              <p className="heading-2" style={{ marginBottom:14 }}>⚠️ How You're Getting Caught</p>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {data.stats.lossMethods.map(([method, count]) => (
                  <div key={method} style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <span style={{ fontSize:'0.875rem', color:'var(--text-secondary)', minWidth:160 }}>{method}</span>
                    <div style={{ flex:1, height:6, background:'var(--surface-2)', borderRadius:99, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${(count/data.stats.lossMethods[0][1])*100}%`, background:'var(--loss)', borderRadius:99 }}/>
                    </div>
                    <span style={{ fontFamily:'var(--font-mono)', fontSize:'0.8125rem', color:'var(--text-muted)', minWidth:20, textAlign:'right' }}>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p style={{ textAlign:'center', fontSize:'0.75rem', color:'var(--text-muted)' }}>
            Generated {new Date(data.generatedAt).toLocaleString()} · <button onClick={load} style={{ background:'none', border:'none', color:'var(--gold)', cursor:'pointer', fontWeight:600, fontSize:'0.75rem' }}>Refresh analysis</button>
          </p>
        </div>
      )}
    </div>
  )
}
