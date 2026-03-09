-- ─────────────────────────────────────────────────────────────────────────────
-- AI Roadmap Builder — Supabase Database Schema
-- Run this entire file in: Supabase Dashboard → SQL Editor → New Query
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. profiles ──────────────────────────────────────────────────────────────
-- Extends Supabase auth.users with a display name.
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text not null,
  created_at timestamptz default now()
);

-- Auto-create a profile row whenever a new user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── 2. roadmaps ──────────────────────────────────────────────────────────────
create table if not exists public.roadmaps (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  title        text not null,
  summary      text,
  total_months integer,
  weekly_hours integer,
  phases       jsonb not null default '[]',   -- full phase array stored as JSON
  form         jsonb not null default '{}',   -- the wizard form answers
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- Index for fast per-user queries
create index if not exists roadmaps_user_id_idx on public.roadmaps(user_id);

-- ── 3. progress ──────────────────────────────────────────────────────────────
create table if not exists public.progress (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  roadmap_id      uuid not null references public.roadmaps(id) on delete cascade,
  current_phase   integer not null default 0,
  completed_phases integer[] not null default '{}',
  checks          jsonb not null default '{}',  -- { "0": { "0": true, "1": false }, ... }
  updated_at      timestamptz default now(),
  unique(user_id, roadmap_id)   -- one progress row per user per roadmap
);

create index if not exists progress_user_roadmap_idx on public.progress(user_id, roadmap_id);

-- ── 4. Row Level Security (RLS) ───────────────────────────────────────────────
-- Users can only read/write their own data. Critical for security.

alter table public.profiles  enable row level security;
alter table public.roadmaps  enable row level security;
alter table public.progress  enable row level security;

-- profiles
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- roadmaps
create policy "Users can view own roadmaps"
  on public.roadmaps for select using (auth.uid() = user_id);
create policy "Users can insert own roadmaps"
  on public.roadmaps for insert with check (auth.uid() = user_id);
create policy "Users can update own roadmaps"
  on public.roadmaps for update using (auth.uid() = user_id);
create policy "Users can delete own roadmaps"
  on public.roadmaps for delete using (auth.uid() = user_id);

-- progress
create policy "Users can view own progress"
  on public.progress for select using (auth.uid() = user_id);
create policy "Users can insert own progress"
  on public.progress for insert with check (auth.uid() = user_id);
create policy "Users can update own progress"
  on public.progress for update using (auth.uid() = user_id);
create policy "Users can delete own progress"
  on public.progress for delete using (auth.uid() = user_id);

-- ── 5. updated_at trigger ─────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_roadmaps_updated_at
  before update on public.roadmaps
  for each row execute function public.set_updated_at();

create trigger set_progress_updated_at
  before update on public.progress
  for each row execute function public.set_updated_at();
