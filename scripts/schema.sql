-- BJJ Tracker Schema
-- Run this in Supabase SQL Editor

create table if not exists matches (
  id bigserial primary key,
  date date not null,
  tournament text not null,
  organization text,
  belt text not null,
  age_division text,
  weight_class text,
  gi_nogi text,
  division_type text,
  opponent text,
  result text not null check (result in ('Win', 'Loss')),
  method text,
  score text,
  medal text,
  created_at timestamptz default now()
);

-- Enable Row Level Security (public read for now, service role for writes)
alter table matches enable row level security;

create policy "Public read access"
  on matches for select
  using (true);

create policy "Service role full access"
  on matches for all
  using (auth.role() = 'service_role');

-- Indexes for common query patterns
create index if not exists idx_matches_date on matches(date desc);
create index if not exists idx_matches_belt on matches(belt);
create index if not exists idx_matches_tournament on matches(tournament);
create index if not exists idx_matches_result on matches(result);
create index if not exists idx_matches_gi_nogi on matches(gi_nogi);
create index if not exists idx_matches_opponent on matches(opponent);
