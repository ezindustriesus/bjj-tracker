# BJJ Competition Tracker — Integration Handoff

## What This Is

I need you to help me integrate a fully-built BJJ competition tracking feature into this app (Mat Metrix) as a native feature — not a link or iframe, but rebuilt inside this codebase so it looks and feels like it was always part of this app.

The feature already exists as a standalone app. This document describes everything that was built so you can rebuild it natively here, matching this app's design system exactly.

---

## Before You Start — Questions I Need You to Answer

Before writing a single line of code, I need you to ask me (or investigate the codebase) to understand:

1. **Tech stack** — What framework, database, and auth system is this app using? The existing feature was built on Next.js 15 + Supabase + Tailwind CSS. If this app uses the same stack, much of the logic can be reused directly. If not, it needs to be adapted.

2. **Design system** — What are this app's colors, fonts, border radius, card styles, button styles, spacing scale, and component patterns? The competition tracker needs to use these exactly — not its own design tokens.

3. **Auth & users** — Does this app already have user accounts and roles? The tracker has an admin/viewer role system. Should that plug into the existing auth, or be its own thing?

4. **Navigation** — Where does this feature live in the app's nav? What should the route structure look like (e.g. `/competition`, `/competition/matches`, `/competition/analytics`)?

5. **Data** — Does this app already have athlete or user profile data the tracker should reference? Or is this Zack Kram's personal data that lives independently?

6. **Existing Supabase project** — Is there already a Supabase project for this app? The tracker needs its own `matches` and `profiles` tables. These should go in the same Supabase project if one exists.

---

## What Was Built — Full Feature Description

### Pages & Routes

| Route | Description |
|-------|-------------|
| `/` (dashboard) | Career overview — record, win rate, submission rate, medals, streak, Gi/No Gi split, win rate by year chart, belt breakdown chart, last 15 matches |
| `/matches` | Full searchable/filterable match table — search by opponent/tournament/method, filter by result/belt/year/gi type/org, sort newest/oldest, paginated, click any row to edit |
| `/tournaments` | All tournaments grouped by event — expandable to show match list per division, medals displayed, filter by year/search |
| `/analytics` | Filter by belt/year/org/gi type — shows record, submission rate, win rate by year chart, Gi breakdown bars, finish method bars |
| `/rivalries` | Repeat opponents (2+ matches) — tap opponent to see full H2H history with methods, scores, dates |
| `/reports` | 5 shareable stat cards (Career Summary, Year Recap, Belt Journey, Current Streak, Gi vs No Gi) — full-width dark cards, PNG download |
| `/insights` | AI-powered performance analysis — 8 insights with category, priority (high/medium/low), icon, and coaching note. Cached locally. |
| `/add-match` | Add match with two modes: Manual (full form) and AI Entry (paste text, upload photo/screenshot/CSV — Claude parses it and pre-fills the form for review) |
| `/admin` | User management — invite users by email, assign roles (admin/viewer), view all users |
| `/login` | Email/password sign in |

---

### Database Schema

Two tables needed in Supabase:

```sql
-- Matches table
create table matches (
  id bigserial primary key,
  date date not null,
  tournament text not null,
  organization text,
  belt text not null,
  age_division text,
  weight_class text,
  gi_nogi text,                 -- 'Gi', 'No Gi', or 'Suit'
  division_type text,           -- 'Regular', 'Challenger', 'Challenger I', 'Round Robin'
  opponent text,
  result text not null check (result in ('Win', 'Loss')),
  method text,                  -- 'Submission', 'Points', 'Heel Hook', etc.
  score text,                   -- e.g. '5-2', optional
  medal text,                   -- 'Gold', 'Silver', 'Bronze', '5th', '7th', optional
  created_at timestamptz default now()
);

-- Profiles table (for roles)
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  role text not null default 'viewer' check (role in ('admin', 'viewer')),
  display_name text,
  created_at timestamptz default now()
);
```

Row Level Security:
- `matches`: authenticated users can read, only admins can insert/update/delete
- `profiles`: authenticated users can read all, update own only

Auto-assign admin role trigger:
```sql
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    new.email,
    case when new.email = 'zack@ezindustriesus.com' then 'admin' else 'viewer' end
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

---

### Data

166 matches exist covering September 2019 through February 2026 across 34 tournaments. The data is in a CSV at `/mnt/project/bjj_competition_results.csv` and includes:

- Date, Tournament, Organization, Belt, Age Division, Weight Class, Gi/NoGi, Division Type, Opponent, Result, Method, Score, Medal

This data needs to be imported into the new Supabase `matches` table once it's created.

---

### API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/matches` | GET | Fetch matches with optional filters: `belt`, `gi_nogi`, `year`, `organization`, `limit` |
| `/api/matches` | POST | Insert one or many matches |
| `/api/matches/[id]` | PATCH | Update a single match |
| `/api/matches/[id]` | DELETE | Delete a single match |
| `/api/ai-parse` | POST | Send text or base64 image to Claude API, get back structured match JSON |
| `/api/ai-insights` | POST | Send pre-computed stats to Claude API, get back 8 performance insights |
| `/api/auth/invite` | POST | Invite a user by email via Supabase admin API |

All write routes require admin role. The service role key is used server-side. The anon key is used client-side.

---

### Key Components

- **StatCard** — label, large mono number, sub-text, optional dark accent variant
- **WinRateChart** — Recharts BarChart, wins (green) vs losses (muted), custom tooltip
- **BeltBreakdown** — belt color dots, win/loss record, win rate progress bar per belt
- **RecentMatches** — table with columns: Result badge, Opponent + Tournament, Method, Gi/NoGi badge, Date
- **EditMatchModal** — slide-in right panel with pre-filled form, save + confirm-delete footer
- **Nav** — desktop: horizontal link bar with hamburger fallback on mobile, sign in/out, role badge

---

### Stat Calculations (lib/stats.ts)

All stats are derived dynamically from the matches table — nothing is stored pre-computed:

- **Overall record** — wins, losses, win rate %
- **Submission rate** — wins by submission / total wins
- **Medal counts** — deduplicated per division (tournament + belt + age + weight + gi + division type)
- **Win rate by year** — grouped by calendar year
- **Win rate by belt** — grouped by belt level (White → Purple order)
- **Gi/No Gi/Suit split** — grouped by gi_nogi field
- **Current streak** — consecutive wins or losses from most recent match
- **Top opponents** — repeat opponents with H2H record
- **Finish methods** — count of each method across all matches

---

### AI Features

Two AI features using the Anthropic API (`claude-opus-4-5`):

**1. AI Match Entry (`/api/ai-parse`)**
- Accepts: freeform text paste, or base64-encoded image (photo, screenshot, CSV)
- Returns: array of structured match objects matching the schema
- Pre-fills the Add Match form for user review before saving
- System prompt includes context about Zack's typical divisions and organizations

**2. AI Insights (`/api/ai-insights`)**
- Pre-computes stats server-side (wins/losses by year, belt, gi/nogi, methods, repeat opponents) to minimize token usage
- Returns: 8 insights with `category`, `title`, `body`, `icon` (emoji), `priority` (high/medium/low)
- Results cached in localStorage to avoid redundant API calls
- Displayed with color-coded priority cards and a summary row (action items / observations / strengths)

**Required environment variable:** `ANTHROPIC_API_KEY`

---

### Current Design (to be replaced by Mat Metrix design system)

The standalone app uses these styles — **replace all of these with Mat Metrix equivalents**:

```css
/* Colors */
--bg: #f7f6f3;           /* warm off-white background */
--surface: #ffffff;
--surface-2: #f0ede8;
--border: #e5e0d8;
--text-primary: #1a1714;
--text-secondary: #6b6459;
--text-muted: #a39b8f;
--gold: #c8952a;          /* primary accent — replace with Mat Metrix primary */
--win: #1a7a4a;           /* green for wins */
--loss: #b33a2a;          /* red for losses */

/* Fonts */
font-family: 'DM Sans', sans-serif;     /* replace with Mat Metrix font */
font-family: 'DM Mono', monospace;      /* used for numbers/stats */

/* Radius */
border-radius: 16px;   /* cards */
border-radius: 8px;    /* inputs, buttons */
```

When rebuilding, swap every design token for the equivalent from Mat Metrix. The component structure and layout logic stays the same — only the visual layer changes.

---

### Roles & Permissions

| Action | Admin | Viewer |
|--------|-------|--------|
| View all pages | ✅ | ✅ |
| Add match (manual or AI) | ✅ | ❌ |
| Edit / delete match | ✅ | ❌ |
| Download reports | ✅ | ✅ |
| Generate AI insights | ✅ | ✅ |
| Invite users / manage roles | ✅ | ❌ |

---

### Dependencies Used

```json
"@supabase/supabase-js": "^2.x",
"recharts": "^3.x",
"lucide-react": "^0.x",
"date-fns": "^4.x",
"html2canvas": "^1.x"
```

---

### Implementation Order (recommended)

1. Answer the context questions at the top of this document
2. Create the `matches` and `profiles` tables in Supabase, run RLS policies and trigger
3. Scaffold the routes/pages within Mat Metrix's routing structure
4. Port `lib/stats.ts` — pure functions, no UI dependencies
5. Port API routes, adapting auth middleware to match Mat Metrix's pattern
6. Build components using Mat Metrix's design system
7. Import the 166 historical matches
8. Add the Anthropic API key to environment variables
9. Test auth flow (sign in, role gating, invite)
10. Test AI entry and AI insights

---

## Reference

Live app: https://bjj-tracker-ochre.vercel.app  
GitHub: https://github.com/ezindustriesus/bjj-tracker  
Data file: `/mnt/project/bjj_competition_results.csv`
