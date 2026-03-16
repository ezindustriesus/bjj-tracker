import { Match } from './supabase'

export function calcOverallRecord(matches: Match[]) {
  const wins = matches.filter(m => m.result === 'Win').length
  const losses = matches.filter(m => m.result === 'Loss').length
  const total = wins + losses
  const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : '0.0'
  return { wins, losses, total, winRate }
}

export function calcSubmissionRate(matches: Match[]) {
  const wins = matches.filter(m => m.result === 'Win')
  const subWins = wins.filter(m =>
    m.method?.toLowerCase().includes('submission') ||
    m.method?.toLowerCase().includes('triangle') ||
    m.method?.toLowerCase().includes('armbar') ||
    m.method?.toLowerCase().includes('heel hook') ||
    m.method?.toLowerCase().includes('choke') ||
    m.method?.toLowerCase().includes('lock') ||
    m.method?.toLowerCase().includes('kimura') ||
    m.method?.toLowerCase().includes('guillotine') ||
    m.method?.toLowerCase().includes('rear naked')
  )
  return wins.length > 0
    ? ((subWins.length / wins.length) * 100).toFixed(1)
    : '0.0'
}

export function calcMedalCounts(matches: Match[]) {
  // Count per unique tournament+division combo
  const divisionMap = new Map<string, string>()
  matches.forEach(m => {
    const key = `${m.tournament}|${m.belt}|${m.age_division}|${m.weight_class}|${m.gi_nogi}|${m.division_type}`
    if (m.medal) divisionMap.set(key, m.medal)
  })
  const medals = Array.from(divisionMap.values())
  return {
    gold: medals.filter(m => m === 'Gold').length,
    silver: medals.filter(m => m === 'Silver').length,
    bronze: medals.filter(m => m === 'Bronze').length,
    total: medals.filter(m => ['Gold', 'Silver', 'Bronze'].includes(m)).length,
  }
}

export function groupByYear(matches: Match[]) {
  const map = new Map<string, { wins: number; losses: number }>()
  matches.forEach(m => {
    const year = new Date(m.date).getFullYear().toString()
    const curr = map.get(year) || { wins: 0, losses: 0 }
    if (m.result === 'Win') curr.wins++
    else curr.losses++
    map.set(year, curr)
  })
  return Array.from(map.entries())
    .map(([year, { wins, losses }]) => ({
      year,
      wins,
      losses,
      total: wins + losses,
      winRate: parseFloat(((wins / (wins + losses)) * 100).toFixed(1)),
    }))
    .sort((a, b) => a.year.localeCompare(b.year))
}

export function groupByBelt(matches: Match[]) {
  const map = new Map<string, { wins: number; losses: number }>()
  const order = ['White', 'Blue', 'Purple', 'Brown', 'Black']
  matches.forEach(m => {
    const curr = map.get(m.belt) || { wins: 0, losses: 0 }
    if (m.result === 'Win') curr.wins++
    else curr.losses++
    map.set(m.belt, curr)
  })
  return Array.from(map.entries())
    .map(([belt, { wins, losses }]) => ({
      belt,
      wins,
      losses,
      total: wins + losses,
      winRate: parseFloat(((wins / (wins + losses)) * 100).toFixed(1)),
    }))
    .sort((a, b) => order.indexOf(a.belt) - order.indexOf(b.belt))
}

export function groupByGiNogi(matches: Match[]) {
  const map = new Map<string, { wins: number; losses: number }>()
  matches.forEach(m => {
    const key = m.gi_nogi || 'Unknown'
    const curr = map.get(key) || { wins: 0, losses: 0 }
    if (m.result === 'Win') curr.wins++
    else curr.losses++
    map.set(key, curr)
  })
  return Array.from(map.entries()).map(([type, { wins, losses }]) => ({
    type,
    wins,
    losses,
    total: wins + losses,
    winRate: parseFloat(((wins / (wins + losses)) * 100).toFixed(1)),
  }))
}

export function getTopOpponents(matches: Match[], minMatches = 2) {
  const map = new Map<string, { wins: number; losses: number }>()
  matches.forEach(m => {
    if (!m.opponent || m.opponent === 'Unknown') return
    const curr = map.get(m.opponent) || { wins: 0, losses: 0 }
    if (m.result === 'Win') curr.wins++
    else curr.losses++
    map.set(m.opponent, curr)
  })
  return Array.from(map.entries())
    .filter(([, { wins, losses }]) => wins + losses >= minMatches)
    .map(([opponent, { wins, losses }]) => ({
      opponent,
      wins,
      losses,
      total: wins + losses,
    }))
    .sort((a, b) => b.total - a.total)
}

export function getCurrentStreak(matches: Match[]) {
  const sorted = [...matches].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
  if (!sorted.length) return { type: 'None', count: 0 }
  const streakType = sorted[0].result
  let count = 0
  for (const m of sorted) {
    if (m.result === streakType) count++
    else break
  }
  return { type: streakType === 'Win' ? 'Win' : 'Loss', count }
}
