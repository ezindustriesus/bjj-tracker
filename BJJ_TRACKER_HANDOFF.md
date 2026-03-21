# BJJ Competition Tracker — MatMetrix Integration Handoff

## Context

This document instructs you to integrate a fully-built BJJ competition tracking feature into MatMetrix as a native feature. It has already been running as a standalone app. Everything here needs to be rebuilt inside MatMetrix's existing codebase — same stack, same design system, same auth — not linked or iframed.

All 6 context questions have been answered. Do not ask them again. Start building.

---

## Stack Mapping

| BJJ Tracker (standalone) | MatMetrix (target) |
|---|---|
| Next.js 15 | React 18 + Vite |
| Supabase client | Neon PostgreSQL + Drizzle ORM |
| Next.js API routes | Express.js routes in `server/routes.ts` |
| Supabase RLS policies | `isAuthenticated` middleware + role checks |
| Supabase Auth | Passport.js (existing) |
| Custom CSS tokens | Tailwind + shadcn/ui (existing theme) |
| `@supabase/supabase-js` | Drizzle ORM queries |

**New dependencies needed:** `recharts` (already in BJJ Tracker, not yet in MatMetrix)

---

## Routes

All competition routes live under `/competition`:

| Path | Page |
|------|------|
| `/competition` | Dashboard — career stats, charts, recent matches |
| `/competition/matches` | Full match table — search, filter, edit |
| `/competition/tournaments` | Grouped by event, expandable |
| `/competition/analytics` | Filter + breakdown charts |
| `/competition/rivalries` | H2H records vs repeat opponents |
| `/competition/reports` | Shareable stat cards, PNG download |
| `/competition/insights` | AI-powered coaching insights |
| `/competition/add-match` | Manual entry + AI entry (text/image/CSV) |

Add a "Competition" nav item in `client/src/App.tsx` linking to `/competition`.

---

## Database Schema

Add to `shared/schema.ts` using Drizzle ORM. Place the `matches` table alongside existing tables.

```typescript
import { pgTable, serial, integer, text, date, timestamp } from 'drizzle-orm/pg-core'
import { users } from './users' // existing users table

export const matches = pgTable('matches', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  date: date('date').notNull(),
  tournament: text('tournament').notNull(),
  organization: text('organization'),
  belt: text('belt').notNull(),
  ageDivision: text('age_division'),
  weightClass: text('weight_class'),
  giNogi: text('gi_nogi'),         // 'Gi' | 'No Gi' | 'Suit'
  divisionType: text('division_type'),
  opponent: text('opponent'),
  result: text('result').notNull(), // 'Win' | 'Loss'
  method: text('method'),
  score: text('score'),
  medal: text('medal'),
  createdAt: timestamp('created_at').defaultNow(),
})

export type Match = typeof matches.$inferSelect
export type InsertMatch = typeof matches.$inferInsert
```

Run `npm run db:push` or equivalent to apply the schema to Neon.

---

## Auth & Roles

No new tables needed. Use the existing `users` table.

- **Admin check:** `req.user.role === 'admin'` (or however MatMetrix currently does it)
- **User ID:** `req.user.claims.sub` or `req.user.id` — check existing routes for the pattern
- All match data is scoped to `userId` — queries always filter by the authenticated user's ID
- Write operations (POST, PATCH, DELETE) require admin role
- Read operations require authentication only

Skip the `/api/auth/invite` route entirely — MatMetrix already has user management.

---

## Express API Routes

Add these to `server/routes.ts`. Follow the exact pattern existing MatMetrix routes use for auth middleware, error handling, and response shape.

### GET `/api/competition/matches`
Query params: `belt`, `gi_nogi`, `year`, `organization`, `limit`, `search`
Returns all matches for `req.user.id`, filtered by any provided params.

### POST `/api/competition/matches`
Body: single match object or array of match objects.
Requires admin. Injects `userId` from `req.user.id`.

### PATCH `/api/competition/matches/:id`
Body: partial match fields to update.
Requires admin. Verify match belongs to `req.user.id`.

### DELETE `/api/competition/matches/:id`
Requires admin. Verify match belongs to `req.user.id`.

### POST `/api/competition/ai-parse`
Body: `{ text?: string, imageBase64?: string, imageType?: string }`
Calls Anthropic API, returns `{ matches: Match[] }` — structured match objects parsed from the input.
Requires auth.

### POST `/api/competition/ai-insights`
Body: `{ matches: Match[] }` — full match list (pre-fetched client-side)
Calls Anthropic API with pre-computed stats, returns `{ insights: Insight[] }`.
Requires auth.

---

## Storage Methods

Add these to `server/storage.ts` (or wherever MatMetrix puts DB query functions):

```typescript
// Get matches with optional filters
async getMatches(userId: number, filters?: {
  belt?: string
  giNogi?: string
  year?: string
  organization?: string
  search?: string
  limit?: number
}): Promise<Match[]>

// Insert one or many matches
async createMatches(matches: InsertMatch[]): Promise<Match[]>

// Update a match
async updateMatch(id: number, userId: number, data: Partial<InsertMatch>): Promise<Match>

// Delete a match
async deleteMatch(id: number, userId: number): Promise<void>
```

---

## Stats Library

Create `client/src/lib/competition-stats.ts`. These are pure functions — no DB calls, no side effects. Port directly from the standalone app.

```typescript
// All inputs are Match[] arrays

calcOverallRecord(matches)
// → { wins, losses, total, winRate: string }

calcSubmissionRate(matches)
// → string (percentage of wins that were submissions)

calcMedalCounts(matches)
// → { gold, silver, bronze, total }
// Deduplicates medals per division: same tournament+belt+age+weight+gi+divisionType = one medal

groupByYear(matches)
// → [{ year, wins, losses, total, winRate }] sorted ascending

groupByBelt(matches)
// → [{ belt, wins, losses, total, winRate }] in White→Purple order

groupByGiNogi(matches)
// → [{ type, wins, losses, total, winRate }]

getCurrentStreak(matches)
// → { type: 'Win'|'Loss', count: number }
// matches must be sorted newest-first

getTopOpponents(matches, minMatches = 2)
// → [{ opponent, wins, losses, total }] sorted by total desc
```

**Medal deduplication note:** Multiple rows can have the same medal (e.g. two wins in a bracket both show "Gold"). To count medals correctly, group by the composite key `tournament|belt|ageDivision|weightClass|giNogi|divisionType` and take the medal from any row in that group. Count unique groups.

---

## UI Components

All components use MatMetrix's existing shadcn/ui components and Tailwind classes. Do not introduce custom CSS variables or DM Sans/DM Mono fonts — use whatever the existing MatMetrix theme provides.

### Components to build:

**`CompetitionStatCard`**
- Uses shadcn `Card`
- Props: `label`, `value`, `sub`, `accent?: boolean`, `icon?: string`
- `accent` variant: dark/inverted background using theme colors
- `value` uses monospaced font (use `font-mono` Tailwind class)

**`WinRateChart`**
- Recharts `BarChart` — wins (green) vs losses (muted), custom tooltip
- Responsive container, no hardcoded widths

**`BeltBreakdown`**
- Progress bars per belt with win rate percentage
- Belt colors: White=#e5e7eb, Blue=#3b82f6, Purple=#8b5cf6, Brown=#92400e

**`RecentMatchesTable`**
- Columns: Result badge, Opponent + Tournament (stacked), Method, Gi/NoGi badge, Date
- Result badge: green "W" / red "L" using shadcn Badge or equivalent
- Horizontally scrollable on mobile (`overflow-x: auto`, `min-width: 480px` inner)

**`EditMatchSheet`**
- shadcn `Sheet` (slide-in panel) — use this instead of a custom modal
- Pre-filled form with all match fields
- Footer: Delete button (confirm on second click) + Save button

**`CompetitionNav`**
- Sub-navigation within the `/competition` section
- Links: Dashboard · Matches · Tournaments · Analytics · Rivalries · Reports · AI Insights
- Add Match button (admin only) — primary color, prominent

---

## Page Layouts

### Mobile-first rules (apply to all pages):
- Stats grids: 2 columns on mobile, 4 on desktop (`grid-cols-2 md:grid-cols-4`)
- Charts: full width, stacked vertically — never side-by-side on mobile
- Filter rows: 2×2 grid on mobile (`grid-cols-2`)
- Tables: `overflow-x-auto` wrapper, `min-width` inner so columns don't collapse
- Card pickers (Reports): horizontal scroll row, `overflow-x-auto`, `whitespace-nowrap` items

### Dashboard (`/competition`)
```
[Header: "Competition Record" + subtitle]
[4 stat cards: Record | Sub Rate | Streak | Medals]  ← 2col mobile, 4col desktop
[3 gi/nogi cards: Gi | No Gi | Suit]
[Win Rate by Year chart]  ← full width
[Belt Breakdown]          ← full width
[Recent Matches table]    ← scrollable
```

### Matches (`/competition/matches`)
```
[Header + running W-L count]
[Search input — full width]
[Filter row: Result | Belt | Type | Year | Org | Sort]  ← wrapping flex
[Match table with pagination — 25 per page]
[EditMatchSheet — opens on row click]
```

### Tournaments (`/competition/tournaments`)
```
[Header + medal totals]
[Search + year filter]
[Stacked tournament cards]
  Each card: date badge | tournament name (wraps) | record | medals
  Expanded: grouped by division, match rows with W/L badge + opponent + method
```

### Rivalries (`/competition/rivalries`)
```
Mobile: list view → tap opponent → detail view (full screen, back button)
Desktop: two-column (list | detail panel)
List row: full opponent name | W-L record | W/L/T badge | › arrow
Detail: opponent name + record summary | stacked match history cards
```

### Analytics (`/competition/analytics`)
```
[Filter grid: 2×2 on mobile]
[4 summary stat cards]
[Year chart — full width]
[Gi/No Gi bars — full width]
[Finish methods bars — full width]
```

### Reports (`/competition/reports`)
```
[Header]
[Card type picker — horizontal scroll row on mobile]
[Year selector — shown when Year Recap active]
[Stat card — full width]
[Download PNG button — full width]
```

Stat card designs (dark background, light text):
- **Career Summary:** 3-col stat grid (Record/Win%/Sub%), Gi split, medals, streak
- **Year Recap:** record, win%, tournaments, submissions, medal counts
- **Belt Journey:** progress bars per belt with W-L and win%
- **Current Streak:** giant number + Win/Loss label, overall stats below
- **Gi vs No Gi:** bars for each type with win%, overall record

Use `html2canvas` for PNG export (`npm install html2canvas`).

### AI Insights (`/competition/insights`)
```
[Header + Generate/Refresh button]
[3 summary cards: Action Items | Observations | Strengths]
[Insight cards — stacked, left border color by priority]
  high = red border  |  medium = amber border  |  low = green border
```

Each insight has: icon (emoji), title, category badge, body text (2-3 sentences with specific numbers).
Cache results in `localStorage` with timestamp. Show "Last updated" time.

### Add Match (`/competition/add-match`)
```
[Tab switcher: Manual Entry | AI Entry]
[Form card]
```

**Manual Entry form sections:**
1. Tournament: Date | Org | Tournament Name
2. Division: Belt | Gi/No Gi | Age Division | Weight Class | Division Type
3. Result: Opponent | Win/Loss toggle | Method | Score | Medal

**AI Entry:**
- File drop zone (photo, screenshot, CSV, PDF)
- Text paste area
- "Parse with AI" button → loading state → Review screen
- Review screen: list of parsed matches, expandable, each has full edit form, individual save + "Save All" button

---

## AI Feature Implementation

### AI Parse (`POST /api/competition/ai-parse`)

```typescript
const SYSTEM_PROMPT = `You are a BJJ competition data parser for Zack Kram's match tracker.

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
  "age_division": "e.g. Master 1 (30+)",
  "weight_class": "e.g. Light (175)",
  "gi_nogi": "Gi|No Gi|Suit",
  "division_type": "Regular|Challenger|Challenger I|Round Robin",
  "opponent": "Opponent Full Name",
  "result": "Win|Loss",
  "method": "Submission|Points|Heel Hook|Armbar|Triangle|etc",
  "score": "e.g. 5-2 or null",
  "medal": "Gold|Silver|Bronze|5th|7th or null"
}

If a field is unknown use null. result must be exactly Win or Loss. If multiple matches, return all. If none found, return [].`
```

Call `https://api.anthropic.com/v1/messages` with model `claude-opus-4-5`, pass text as user message or image as base64 content block.

### AI Insights (`POST /api/competition/ai-insights`)

Pre-compute these stats server-side before calling the API (keeps token usage low):

```typescript
// Compute before API call:
const wins = matches.filter(m => m.result === 'Win').length
const losses = matches.length - wins
const winRate = ((wins / matches.length) * 100).toFixed(1)
const byYear = /* group by year, format as "2025: 18W-4L (82%)" */
const byBelt = /* group by belt */
const byGiNogi = /* group by gi_nogi with win rates */
const methods = /* top 8 finish methods with counts */
const lossMethods = /* top 5 ways matches were lost */
const repeatOpponents = /* opponents with 2+ matches, W-L per */
const recentForm = /* last 10 matches W-L */
const streak = /* current streak */
```

Prompt asks for exactly 8 insights, JSON array only:
```typescript
type Insight = {
  category: string    // e.g. "Submission Game", "Defense", "Trends"
  title: string       // 5-8 words
  body: string        // 2-3 sentences with specific numbers
  icon: string        // single emoji
  priority: 'high' | 'medium' | 'low'  // high=needs work, low=strength
}
```

**Required env var:** `ANTHROPIC_API_KEY`

---

## Data Import

166 historical matches need to be imported into the new `matches` table once it exists. The data is in a CSV with these columns:

```
Date, Tournament, Organization, Belt, Age Division, Weight Class, Gi/NoGi, Division Type, Opponent, Result, Method, Score, Medal
```

Write a one-time import script or seed function that:
1. Reads the CSV
2. Maps column names to schema field names (note: `Gi/NoGi` → `giNogi`, `Age Division` → `ageDivision`, etc.)
3. Strips the time component from Date values (they come as `2026-02-21 00:00:00`)
4. Inserts all rows with `userId` set to Zack's user ID in the MatMetrix database
5. Handles empty strings as `null`

The CSV data is available at `/mnt/project/bjj_competition_results.csv` in the project files.

---

## Implementation Order

Follow this order — each step unblocks the next:

1. **Schema** — add `matches` table to `shared/schema.ts`, run migration
2. **Storage** — add query methods to `server/storage.ts`
3. **API routes** — add all `/api/competition/*` routes to `server/routes.ts`
4. **Data import** — seed the 166 matches
5. **Stats lib** — create `client/src/lib/competition-stats.ts`
6. **Shared components** — StatCard, WinRateChart, BeltBreakdown, RecentMatchesTable, EditMatchSheet
7. **Pages** — Dashboard first (most components), then Matches, Tournaments, Analytics, Rivalries, Reports, Insights, Add Match
8. **Sub-nav** — CompetitionNav component, wire into App.tsx
9. **AI features** — ai-parse and ai-insights routes + client UI
10. **Polish** — mobile layout audit, loading states, empty states

---

## Reference

- Live standalone app: https://bjj-tracker-ochre.vercel.app
- Standalone GitHub: https://github.com/ezindustriesus/bjj-tracker
- CSV data: `/mnt/project/bjj_competition_results.csv`
- All 166 matches span September 2019 – February 2026 across 34 tournaments
