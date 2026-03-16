import { NextRequest, NextResponse } from 'next/server'
import { Match } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const { matches }: { matches: Match[] } = await request.json()
  if (!matches?.length) return NextResponse.json({ error: 'No matches provided' }, { status: 400 })

  // Pre-compute stats to keep token usage low
  const wins = matches.filter(m => m.result === 'Win').length
  const losses = matches.filter(m => m.result === 'Loss').length
  const winRate = ((wins / matches.length) * 100).toFixed(1)

  const byYear = Object.entries(
    matches.reduce((acc, m) => {
      const y = m.date?.slice(0, 4) || 'unknown'
      if (!acc[y]) acc[y] = { wins: 0, losses: 0 }
      if (m.result === 'Win') acc[y].wins++; else acc[y].losses++
      return acc
    }, {} as Record<string, { wins: number; losses: number }>)
  ).sort().map(([year, r]) => `${year}: ${r.wins}W-${r.losses}L (${((r.wins/(r.wins+r.losses))*100).toFixed(0)}%)`).join(', ')

  const byBelt = Object.entries(
    matches.reduce((acc, m) => {
      if (!acc[m.belt]) acc[m.belt] = { wins: 0, losses: 0 }
      if (m.result === 'Win') acc[m.belt].wins++; else acc[m.belt].losses++
      return acc
    }, {} as Record<string, { wins: number; losses: number }>)
  ).map(([belt, r]) => `${belt}: ${r.wins}W-${r.losses}L`).join(', ')

  const byGiNogi = Object.entries(
    matches.reduce((acc, m) => {
      const k = m.gi_nogi || 'unknown'
      if (!acc[k]) acc[k] = { wins: 0, losses: 0 }
      if (m.result === 'Win') acc[k].wins++; else acc[k].losses++
      return acc
    }, {} as Record<string, { wins: number; losses: number }>)
  ).map(([type, r]) => `${type}: ${r.wins}W-${r.losses}L (${((r.wins/(r.wins+r.losses))*100).toFixed(0)}%)`).join(', ')

  const methods = Object.entries(
    matches.reduce((acc, m) => {
      if (m.method) acc[m.method] = (acc[m.method] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  ).sort((a,b) => b[1]-a[1]).slice(0,8).map(([m, c]) => `${m}(${c})`).join(', ')

  const losses_by_method = Object.entries(
    matches.filter(m => m.result === 'Loss').reduce((acc, m) => {
      if (m.method) acc[m.method] = (acc[m.method] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  ).sort((a,b) => b[1]-a[1]).slice(0,5).map(([m, c]) => `${m}(${c})`).join(', ')

  const repeat_opponents = Object.entries(
    matches.reduce((acc, m) => {
      if (m.opponent && m.opponent !== 'Unknown') acc[m.opponent] = (acc[m.opponent] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  ).filter(([,c]) => c >= 2).sort((a,b) => b[1]-a[1]).slice(0,5)
  .map(([opp, count]) => {
    const oWins = matches.filter(m => m.opponent === opp && m.result === 'Win').length
    return `${opp}: ${oWins}W-${count - oWins}L`
  }).join(', ')

  const recent10 = matches.slice(0,10)
  const recentWins = recent10.filter(m => m.result === 'Win').length
  const streak = (() => {
    let count = 0; const type = matches[0]?.result
    for (const m of matches) { if (m.result === type) count++; else break }
    return `${count} ${type}${count !== 1 ? 's' : ''}`
  })()

  const byOrg = Object.entries(
    matches.reduce((acc, m) => {
      if (!acc[m.organization]) acc[m.organization] = { wins: 0, losses: 0 }
      if (m.result === 'Win') acc[m.organization].wins++; else acc[m.organization].losses++
      return acc
    }, {} as Record<string, { wins: number; losses: number }>)
  ).map(([org, r]) => `${org}: ${r.wins}W-${r.losses}L (${((r.wins/(r.wins+r.losses))*100).toFixed(0)}%)`).join(', ')

  const prompt = `You are a BJJ performance coach analyzing competition data for Zack Kram (Purple belt, Masters division).

STATS SUMMARY:
- Overall: ${wins}W-${losses}L (${winRate}% win rate), ${matches.length} total matches
- Current streak: ${streak}
- Last 10 matches: ${recentWins}W-${10-recentWins}L
- By year: ${byYear}
- By belt: ${byBelt}
- Gi/No Gi/Suit: ${byGiNogi}
- All finish methods: ${methods}
- How losses happen: ${losses_by_method}
- Repeat opponents (2+ matches): ${repeat_opponents || 'none yet'}
- By organization: ${byOrg}

Generate exactly 8 insights. Each should be specific, data-backed, and actionable — not generic. Cover patterns in wins/losses, submission game, Gi vs No Gi performance, year-over-year trends, notable improvements, weakness patterns, and one motivational observation.

Return ONLY valid JSON array, no markdown:
[
  {
    "category": "Submission Game|Defense|Gi Performance|No Gi Performance|Trends|Rivals|Mental Game|Coaching Note",
    "title": "Short punchy title (5-8 words)",
    "body": "2-3 sentences with specific numbers and actionable takeaway.",
    "icon": "single emoji",
    "priority": "high|medium|low"
  }
]

Priority: high = needs work, medium = interesting pattern, low = strength to build on.`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY ?? '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-5',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    return NextResponse.json({ error: `AI error: ${err}` }, { status: 500 })
  }

  const aiData = await response.json()
  const raw = aiData.content?.[0]?.text || '[]'
  try {
    const clean = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const insights = JSON.parse(clean)
    return NextResponse.json({ insights })
  } catch {
    return NextResponse.json({ error: 'Could not parse AI response', raw }, { status: 500 })
  }
}
