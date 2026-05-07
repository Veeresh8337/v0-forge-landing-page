-- ============================================================
-- FORGE PLATFORM — Canonical Database Schema (v2)
-- Run in Supabase SQL Editor → run all at once
-- ============================================================

-- ─── 1. PROFILES ────────────────────────────────────────────
create table if not exists profiles (
  id               uuid references auth.users(id) on delete cascade primary key,
  created_at       timestamptz default now(),
  full_name        text,
  role             text check (role in ('student', 'client')),
  avatar_url       text,
  bio              text,
  github_url       text,
  skills           text[] default '{}',
  portfolio_links  text[] default '{}',
  published        boolean default false
);

alter table profiles enable row level security;

-- Anyone can view published profiles
create policy "profiles_select" on profiles for select
  using (published = true or auth.uid() = id);

-- Users manage only their own profile
create policy "profiles_insert" on profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update" on profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, avatar_url, github_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'user_name',
      ''
    ),
    new.raw_user_meta_data->>'avatar_url',
    case
      when new.raw_user_meta_data->>'user_name' is not null
      then 'https://github.com/' || (new.raw_user_meta_data->>'user_name')
      else null
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ─── 2. PROJECTS ────────────────────────────────────────────
create table if not exists projects (
  id           uuid default gen_random_uuid() primary key,
  created_at   timestamptz default now(),
  client_id    uuid references auth.users(id) on delete cascade not null,
  title        text not null,
  description  text not null,
  budget       numeric(10,2),
  milestones   jsonb default '[]',
  status       text not null default 'open'
               check (status in ('open', 'in-progress', 'completed'))
);

alter table projects enable row level security;

-- Open projects visible to everyone; own projects always visible
create policy "projects_select" on projects for select
  using (status = 'open' or auth.uid() = client_id);

create policy "projects_insert" on projects for insert
  with check (auth.uid() = client_id);

create policy "projects_update" on projects for update
  using (auth.uid() = client_id);


-- ─── 3. BIDS ────────────────────────────────────────────────
create table if not exists bids (
  id             uuid default gen_random_uuid() primary key,
  created_at     timestamptz default now(),
  project_id     uuid references projects(id) on delete cascade not null,
  student_id     uuid references auth.users(id) on delete cascade not null,
  proposal_text  text,
  bid_amount     numeric(10,2),
  status         text not null default 'pending'
                 check (status in ('pending', 'accepted', 'rejected')),
  unique(project_id, student_id)
);

alter table bids enable row level security;

create policy "bids_insert" on bids for insert
  with check (auth.uid() = student_id);

-- Student sees own bids; client sees bids on their project
create policy "bids_select" on bids for select
  using (
    auth.uid() = student_id or
    auth.uid() in (select client_id from projects where id = project_id)
  );

-- Only client can update bid status
create policy "bids_update" on bids for update
  using (
    auth.uid() in (select client_id from projects where id = project_id)
  );


-- ─── 4. Enable Realtime ─────────────────────────────────────
alter publication supabase_realtime add table projects;
alter publication supabase_realtime add table profiles;
alter publication supabase_realtime add table bids;
