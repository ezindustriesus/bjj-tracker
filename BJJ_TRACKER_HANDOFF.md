# BJJ Competition Tracker — Mat Metrix Integration Handoff

## Context

This document is for a Claude instance working inside the **Mat Metrix** project. It describes a fully-built standalone BJJ competition tracking app that needs to be rebuilt natively inside Mat Metrix as a first-class feature — not linked, not embedded, but fully integrated using Mat Metrix's existing stack, design system, auth, and database.

The standalone app is live at: https://bjj-tracker-ochre.vercel.app  
GitHub reference: https://github.com/ezindustriesus/bjj-tracker  
Historical data file: `bjj_competition_results.csv` (166 matches)

---

## Stack Mapping — BJJ Tracker → Mat Metrix

| Layer | BJJ Tracker (standalone) | Mat Metrix (target) |
|-------|--------------------------|----------------------|
| Framework | Next.js 15 | React 18 + Vite |
| Backend | Next.js API routes | Express.js (`server/routes.ts`) |
| Database | Supabase (PostgreSQL) | Neon PostgreSQL |
| ORM | Supabase client | Drizzle ORM (`shared/schema.ts`) |
| Auth | Supabase Auth | Passport.js (email/password + Google OAuth) |
| User ID | `auth.uid()` | `req.user.claims.sub` |
| Role check | `profiles` table RLS | `user.role === 'admin'` on existing `users` table |
| Styling | Custom CSS tokens | Tailwind CSS + shadcn/ui |
| Icons | lucide-react | lucide-react (already installed) |
| Charts | Recharts | **Add Recharts** (`npm install recharts`) |
| AI | Anthropic API | Anthropic API (same — keep `ANTHROPIC_API_KEY`) |
| PDF/PNG export | html2canvas | html2canvas (add if not present) |

**Key differences to keep in mind:**
- No Supabase client anywhere — all DB access goes through Drizzle
- No Next.js server components or API routes — Express routes only
- No RLS policies needed — access control via `isAuthenticated` middleware + role checks
- No `/api/auth/invite` route — Mat Metrix has its own user management, skip it
- No separate `profiles` table — use existing `users` table, `user.role` field

---

## Database Schema

Add this to `shared/schema.ts` using Drizzle ORM:

```typescript
import { pgTable, serial, text, date, timestamp, integer } from 'drizzle-orm/pg-core'
import { users } from './users' // or wherever the users table is defined

export const matches = pgTable('matches', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  date: date('date').notNull(),
  tournament: text('tournament').notNull(),
  organization: text('organization'),
  belt: text('belt').notNull(),
  ageDivision: text('age_division'),
  weightClass: text('weight_class'),
  giNogi: text('gi_nogi'),           // 'Gi', 'No Gi', or 'Suit'
  divisionType: text('division_type'), // 'Regular', 'Challenger', 'Challenger I', 'Round Robin'
  opponent: text('opponent'),
  result: text('result').notNull(),   // 'Win' or 'Loss'
  method: text('method'),             // 'Submission', 'Points', 'Heel Hook', etc.
  score: text('score'),               // e.g. '5-2', nullable
  medal: text('medal'),               // 'Gold', 'Silver', 'Bronze', '5th', '7th', nullable
  createdAt: timestamp('created_at').defaultNow(),
})

export type Match = typeof matches.$inferSelect
export type InsertMatch = typeof matches.$inferInsert
```

Run the migration after adding this. No RLS, no triggers — just the table.

---

## Routes — Mat Metrix Structure

### Client routes (add to `client/src/App.tsx`)

```
/competition              → Competition dashboard
/competition/matches      → All matches table with search/filter/edit
/competition/tournaments  → Grouped by tournament, expandable
/competition/analytics    → Filter + charts + breakdowns
/competition/rivalries    → H2H records vs repeat opponents
/competition/reports      → Shareable stat cards (PNG download)
/competition/insights     → AI performance analysis
/competition/add-match    → Manual entry + AI entry
```

Add a "Competition" nav item to the existing MatMetrix sidebar/tab navigation.

### Server routes (add to `server/routes.ts`)

```
GET    /api/competition/matches          → list matches (with query filters)
POST   /api/competition/matches          → insert one or many matches
PATCH  /api/competition/matches/:id      → update a match
DELETE /api/competition/matches/:id      → delete a match
POST   /api/competition/ai-parse         → AI match entry (text or image)
POST   /api/competition/ai-insights      → AI performance insights
```

All routes use the existing `isAuthenticated` middleware. Write routes (POST/PATCH/DELETE) additionally check `req.user.role === 'admin'`.

---

## Server Route Logic

### GET /api/competition/matches

```typescript
app.get('/api/competition/matches', isAuthenticated, async (req, res) => {
  const { belt, gi_nogi, year, organization, limit } = req.query
  
  let query = db.select().from(matches).orderBy(desc(matches.date))
  
  // Add filters
  const conditions = []
  if (belt) conditions.push(eq(matches.belt, belt as string))
  if (gi_nogi) conditions.push(eq(matches.giNogi, gi_nogi as string))
  if (organization) conditions.push(eq(matches.organization, organization as string))
  if (year) {
    conditions.push(gte(matches.date, `${year}-01-01`))
    conditions.push(lte(matches.date, `${year}-12-31`))
  }
  if (conditions.length) query = query.where(and(...conditions))
  if (limit) query = query.limit(parseInt(limit as string))
  
  const data = await query
  res.json(data)
})
```

### POST /api/competition/matches

```typescript
app.post('/api/competition/matches', isAuthenticated, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' })
  
  const userId = req.user.claims.sub
  const body = Array.isArray(req.body) ? req.body : [req.body]
  const rows = body.map(m => ({ ...m, userId }))
  
  const inserted = await db.insert(matches).values(rows).returning()
  res.status(201).json(inserted)
})
```

### PATCH /api/competition/matches/:id

```typescript
app.patch('/api/competition/matches/:id', isAuthenticated, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' })
  
  const { id } = req.params
  const updated = await db.update(matches)
    .set(req.body)
    .where(eq(matches.id, parseInt(id)))
    .returning()
  
  res.json(updated[0])
})
```

### DELETE /api/competition/matches/:id

```typescript
app.delete('/api/competition/matches/:id', isAuthenticated, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' })
  
  await db.delete(matches).where(eq(matches.id, parseInt(req.params.id)))
  res.json({ success: true })
})
```

### POST /api/competition/ai-parse

```typescript
app.post('/api/competition/ai-parse', isAuthenticated, async (req, res) => {
  const { text, imageBase64, imageType } = req.body
  
  const content: any[] = []
  if (imageBase64) {
    content.push({ type: 'image', source: { type: 'base64', media_type: imageType || 'image/jpeg', data: imageBase64 } })
  }
  content.push({
    type: 'text',
    text: text ? `Parse the following into match data:\n\n${text}` : 'Parse the matches shown in this image.'
  })
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-5',
      max_tokens: 4096,
      system: AI_PARSE_SYSTEM_PROMPT, // see AI section below
      messages: [{ role: 'user', content }],
    }),
  })
  
  const aiData = await response.json()
  const raw = aiData.content?.[0]?.text || '[]'
  const clean = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  const parsedMatches = JSON.parse(clean)
  
  res.json({ matches: Array.isArray(parsedMatches) ? parsedMatches : [parsedMatches] })
})
```

### POST /api/competition/ai-insights

```typescript
app.post('/api/competition/ai-insights', isAuthenticated, async (req, res) => {
  const { matches } = req.body
  
  // Pre-compute stats to minimize tokens (see stats section)
  const statsContext = buildStatsContext(matches)
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-5',
      max_tokens: 2048,
      messages: [{ role: 'user', content: buildInsightsPrompt(statsContext) }],
    }),
  })
  
  const aiData = await response.json()
  const raw = aiData.content?.[0]?.text || '[]'
  const clean = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  res.json({ insights: JSON.parse(clean) })
})
```

---

## Stats Library

Create `client/src/lib/competition-stats.ts` (pure functions, no dependencies):

```typescript
export type Match = {
  id?: number
  date: string
  tournament: string
  organization: string
  belt: string
  ageDivision: string
  weightClass: string
  giNogi: string
  divisionType: string
  opponent: string
  result: 'Win' | 'Loss'
  method: string
  score?: string | null
  medal?: string | null
}

export function calcOverallRecord(matches: Match[]) {
  const wins = matches.filter(m => m.result === 'Win').length
  const losses = matches.filter(m => m.result === 'Loss').length
  const total = wins + losses
  return { wins, losses, total, winRate: total > 0 ? ((wins / total) * 100).toFixed(1) : '0.0' }
}

export function calcSubmissionRate(matches: Match[]) {
  const wins = matches.filter(m => m.result === 'Win')
  const subWins = wins.filter(m => {
    const method = m.method?.toLowerCase() || ''
    return method.includes('submission') || method.includes('triangle') ||
      method.includes('armbar') || method.includes('heel hook') ||
      method.includes('choke') || method.includes('lock') ||
      method.includes('kimura') || method.includes('guillotine') ||
      method.includes('rear naked') || method.includes('arm triangle')
  })
  return wins.length > 0 ? ((subWins.length / wins.length) * 100).toFixed(1) : '0.0'
}

export function calcMedalCounts(matches: Match[]) {
  const divisionMap = new Map<string, string>()
  matches.forEach(m => {
    const key = `${m.tournament}|${m.belt}|${m.ageDivision}|${m.weightClass}|${m.giNogi}|${m.divisionType}`
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
    if (m.result === 'Win') curr.wins++; else curr.losses++
    map.set(year, curr)
  })
  return Array.from(map.entries())
    .map(([year, { wins, losses }]) => ({ year, wins, losses, total: wins + losses, winRate: parseFloat(((wins / (wins + losses)) * 100).toFixed(1)) }))
    .sort((a, b) => a.year.localeCompare(b.year))
}

export function groupByBelt(matches: Match[]) {
  const order = ['White', 'Blue', 'Purple', 'Brown', 'Black']
  const map = new Map<string, { wins: number; losses: number }>()
  matches.forEach(m => {
    const curr = map.get(m.belt) || { wins: 0, losses: 0 }
    if (m.result === 'Win') curr.wins++; else curr.losses++
    map.set(m.belt, curr)
  })
  return Array.from(map.entries())
    .map(([belt, { wins, losses }]) => ({ belt, wins, losses, total: wins + losses, winRate: parseFloat(((wins / (wins + losses)) * 100).toFixed(1)) }))
    .sort((a, b) => order.indexOf(a.belt) - order.indexOf(b.belt))
}

export function groupByGiNogi(matches: Match[]) {
  const map = new Map<string, { wins: number; losses: number }>()
  matches.forEach(m => {
    const key = m.giNogi || 'Unknown'
    const curr = map.get(key) || { wins: 0, losses: 0 }
    if (m.result === 'Win') curr.wins++; else curr.losses++
    map.set(key, curr)
  })
  return Array.from(map.entries()).map(([type, { wins, losses }]) => ({
    type, wins, losses, total: wins + losses,
    winRate: parseFloat(((wins / (wins + losses)) * 100).toFixed(1))
  }))
}

export function getTopOpponents(matches: Match[], minMatches = 2) {
  const map = new Map<string, { wins: number; losses: number }>()
  matches.forEach(m => {
    if (!m.opponent || m.opponent === 'Unknown') return
    const curr = map.get(m.opponent) || { wins: 0, losses: 0 }
    if (m.result === 'Win') curr.wins++; else curr.losses++
    map.set(m.opponent, curr)
  })
  return Array.from(map.entries())
    .filter(([, { wins, losses }]) => wins + losses >= minMatches)
    .map(([opponent, { wins, losses }]) => ({ opponent, wins, losses, total: wins + losses }))
    .sort((a, b) => b.total - a.total)
}

export function getCurrentStreak(matches: Match[]) {
  const sorted = [...matches].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  if (!sorted.length) return { type: 'None', count: 0 }
  const streakType = sorted[0].result
  let count = 0
  for (const m of sorted) {
    if (m.result === streakType) count++
    else break
  }
  return { type: streakType === 'Win' ? 'Win' : 'Loss', count }
}
```

---

## AI Prompts

### AI Parse System Prompt

```typescript
const AI_PARSE_SYSTEM_PROMPT = `You are a BJJ competition data parser for Zack Kram's match tracker.

Extract match data from any input: text descriptions, tournament result screenshots, bracket photos, spreadsheet data, handwritten notes, or any other format.

Context about Zack:
- Competes at Purple belt (previously White and Blue)
- Age divisions: Master 1 (30+), Master 2 (35+), Adult (18+), Masters
- Typical weight: Light (175), Challenger I (175)
- Common orgs: AGF, IBJJF, Springfield BJJ, Newbreed, Chewjitsu

Return ONLY a valid JSON array of match objects. No explanation, no markdown, no preamble.

Each match object must have these exact fields:
{
  "date": "YYYY-MM-DD",
  "tournament": "full tournament name",
  "organization": "org abbreviation",
  "belt": "White|Blue|Purple|Brown|Black",
  "ageDivision": "e.g. Master 1 (30+)",
  "weightClass": "e.g. Light (175)",
  "giNogi": "Gi|No Gi|Suit",
  "divisionType": "Regular|Challenger|Challenger I|Round Robin",
  "opponent": "Opponent Full Name",
  "result": "Win|Loss",
  "method": "Submission|Points|Heel Hook|Armbar|Triangle|Kimura|Guillotine|Rear Naked Choke|Overtime|Ref Decision|Tie Breaker|Disqualification|Walkover",
  "score": "e.g. 5-2 or null",
  "medal": "Gold|Silver|Bronze|5th|7th or null"
}

If a field is unknown use null. Return a single-element array for one match. Return [] if nothing can be parsed.`
```

### AI Insights Prompt Builder

```typescript
function buildStatsContext(matches: any[]) {
  const wins = matches.filter(m => m.result === 'Win').length
  const losses = matches.filter(m => m.result === 'Loss').length

  const byYear = Object.entries(
    matches.reduce((acc, m) => {
      const y = m.date?.slice(0, 4) || 'unknown'
      if (!acc[y]) acc[y] = { wins: 0, losses: 0 }
      if (m.result === 'Win') acc[y].wins++; else acc[y].losses++
      return acc
    }, {} as Record<string, any>)
  ).sort().map(([y, r]: any) => `${y}: ${r.wins}W-${r.losses}L`).join(', ')

  const byBelt = Object.entries(
    matches.reduce((acc, m) => {
      if (!acc[m.belt]) acc[m.belt] = { wins: 0, losses: 0 }
      if (m.result === 'Win') acc[m.belt].wins++; else acc[m.belt].losses++
      return acc
    }, {} as Record<string, any>)
  ).map(([b, r]: any) => `${b}: ${r.wins}W-${r.losses}L`).join(', ')

  const lossMethods = Object.entries(
    matches.filter(m => m.result === 'Loss').reduce((acc, m) => {
      if (m.method) acc[m.method] = (acc[m.method] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  ).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5).map(([m, c]) => `${m}(${c})`).join(', ')

  const recent = matches.slice(0, 10)
  const recentWins = recent.filter(m => m.result === 'Win').length
  const streak = (() => {
    let count = 0; const type = matches[0]?.result
    for (const m of matches) { if (m.result === type) count++; else break }
    return `${count} ${type}s`
  })()

  return { wins, losses, total: matches.length, winRate: ((wins/matches.length)*100).toFixed(1), byYear, byBelt, lossMethods, recentRecord: `${recentWins}W-${10-recentWins}L (last 10)`, streak }
}

function buildInsightsPrompt(stats: ReturnType<typeof buildStatsContext>) {
  return `You are a BJJ performance coach analyzing competition data for Zack Kram (Purple belt, Masters division).

STATS: Overall ${stats.wins}W-${stats.losses}L (${stats.winRate}%), ${stats.total} matches
Streak: ${stats.streak} | Recent: ${stats.recentRecord}
By year: ${stats.byYear}
By belt: ${stats.byBelt}
How losses happen: ${stats.lossMethods}

Generate exactly 8 insights. Each must be specific, data-backed, and actionable. Cover: win rate trends, submission patterns, Gi vs No Gi, year-over-year improvement, weaknesses, and one motivational note.

Return ONLY a JSON array, no markdown:
[{ "category": "string", "title": "5-8 word title", "body": "2-3 sentences with specific numbers.", "icon": "emoji", "priority": "high|medium|low" }]

Priority: high = needs work, medium = interesting pattern, low = strength.`
}
```

---

## UI Pages — What to Build

Each page below needs to be built as a React component using **Mat Metrix's existing design system** (shadcn/ui components, Tailwind classes, existing Card/Button/Badge/Input/Select components). Do not introduce new design tokens.

### 1. Dashboard (`/competition`)
- Page header: "Competition Record" with sub-stat (total matches, tournaments, date range)
- 4 stat cards: Overall Record, Submission Rate, Current Streak, Total Medals
- 3 mini cards: Gi / No Gi / Suit split (wins-losses + win%)
- Win rate by year bar chart (Recharts BarChart)
- Belt breakdown progress bars
- Recent 15 matches table (scrollable on mobile)

### 2. Matches (`/competition/matches`)
- Search bar (opponent, tournament, method, org)
- Filter row: Result, Belt, Gi/NoGi, Year, Org, Sort direction
- Live W-L count for filtered set
- Paginated table (25/page): Date | W/L badge + Opponent | Tournament + Org | Method | Score | Gi badge | Belt | Medal
- Click any row → slide-in edit panel (pre-filled form, save + confirm-delete)

### 3. Tournaments (`/competition/tournaments`)
- Filter: search + year
- List of tournament cards, sorted newest first
- Each card: date badge, full tournament name (no truncation), org + match count, W-L record + win%, medals
- Tap/click to expand → divisions grouped within, each division shows match list (W/L badge + opponent + method + score)

### 4. Analytics (`/competition/analytics`)
- 2×2 filter grid: Belt, Gi/NoGi, Year, Org
- 4 summary stat cards
- Win rate by year chart (full width)
- Gi/No Gi/Suit breakdown bars (full width)
- Finish methods breakdown bars (full width)

### 5. Rivalries (`/competition/rivalries`)
- List of opponents faced 2+ times: full name, match count, W-L record, W/L/T badge
- Tap opponent → drill-down view: H2H record summary + all matches (tournament, method, belt, gi/nogi, score, date)
- Mobile: list → detail navigation (no side-by-side panels)

### 6. Reports (`/competition/reports`)
- Horizontally scrollable card type picker: Career Summary, Year Recap, Belt Journey, Current Streak, Gi vs No Gi
- Full-width stat card preview (dark background cards)
- Download PNG button (html2canvas)
- Year selector when Year Recap is active

### 7. AI Insights (`/competition/insights`)
- Generate button → calls `/api/competition/ai-insights`
- Results cached in localStorage
- Summary row: count of high/medium/low priority insights
- Insight cards: left colored border by priority, icon, title, category badge, body text
- Loading skeleton while generating

### 8. Add Match (`/competition/add-match`)
- Tab switcher: Manual Entry | AI Entry
- **Manual:** full form (date, org, tournament, belt, gi/nogi, age div, weight, division type, opponent, result toggle, method, score, medal)
- **AI Entry:** file drop zone (image/CSV/PDF) + text paste area → Parse button → review screen showing parsed matches, each expandable to edit before saving
- Admin only (redirect non-admins)

---

## Data Import

After the schema is created and migrated, import the 166 historical matches. The CSV is at `bjj_competition_results.csv` in the project files.

Column mapping from CSV → schema:
```
Date           → date (strip time, keep YYYY-MM-DD)
Tournament     → tournament
Organization   → organization
Belt           → belt
Age Division   → ageDivision
Weight Class   → weightClass
Gi/NoGi        → giNogi
Division Type  → divisionType
Opponent       → opponent
Result         → result
Method         → method
Score          → score (null if empty)
Medal          → medal (null if empty)
```

Set `userId` to Zack's user ID from the `users` table for all imported rows.

---

## Environment Variable

Add to Mat Metrix's environment:
```
ANTHROPIC_API_KEY=sk-ant-...
```

This is already set and working in the standalone app.

---

## Implementation Order

1. **Confirm** the `users` table field name for role (`role`?) and user ID (`id`? or something else?)
2. **Add** `matches` table to `shared/schema.ts`, run migration
3. **Install** Recharts: `npm install recharts`
4. **Add** server routes to `server/routes.ts`
5. **Create** `client/src/lib/competition-stats.ts`
6. **Create** AI prompt helpers (can live in a server utility file)
7. **Build** UI pages using shadcn/ui components
8. **Add** Competition nav item to `client/src/App.tsx`
9. **Import** 166 historical matches (write a one-time script or seed function)
10. **Test** auth gating, AI entry, AI insights, PNG download

---

## Reference — Feature Behavior

The live standalone app at https://bjj-tracker-ochre.vercel.app shows exactly how every feature works and looks. Use it as a reference for behavior — but all visual styling must match Mat Metrix, not the standalone app's warm beige/gold theme.

Key behaviors to preserve exactly:
- Medal deduplication: medals are counted per division (tournament + belt + age + weight + gi + divisionType), not per match
- AI parse review flow: parsed matches shown as expandable cards, each editable before saving, "Save All" batch option
- AI insights caching: results stored in localStorage, "Refresh" option to regenerate
- Edit modal: slide-in panel with confirm-before-delete (click once to arm, click again to confirm)
- Rivalries drill-down: mobile uses full-screen detail view, not side-by-side
- Reports: stat cards have dark backgrounds regardless of app theme (they're export artifacts)
