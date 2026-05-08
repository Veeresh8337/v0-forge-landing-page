-- ============================================================
-- FORGE PLATFORM — Canonical Database Schema (v3)
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
  published        boolean default false,
  location         text,
  linkedin_url     text,
  social_links     text[] default '{}',
  work_samples     text[] default '{}',
  phone_number     text,
  github_repos     jsonb default '[]'::jsonb,
  total_reviews    integer default 0,
  average_rating   numeric(3,2) default 0.00
);

alter table profiles enable row level security;

create policy "profiles_select" on profiles for select using (published = true or auth.uid() = id);
create policy "profiles_insert" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on profiles for update using (auth.uid() = id);

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
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz default now(),
  client_id        uuid references profiles(id) on delete cascade not null,
  title            text not null,
  description      text not null,
  budget           text,
  timeline         text,
  tech_stack       text[] default '{}',
  status           text check (status in ('open', 'in_progress', 'completed', 'cancelled')) default 'open'
);

alter table projects enable row level security;

create policy "projects_select" on projects for select using (true);
create policy "projects_insert" on projects for insert with check (auth.uid() = client_id);
create policy "projects_update" on projects for update using (auth.uid() = client_id);

-- ─── 3. BIDS ────────────────────────────────────────────────
create table if not exists bids (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz default now(),
  project_id       uuid references projects(id) on delete cascade not null,
  student_id       uuid references profiles(id) on delete cascade not null,
  cover_letter     text,
  proposed_budget  text,
  status           text check (status in ('pending', 'accepted', 'rejected')) default 'pending',
  unique(project_id, student_id)
);

alter table bids enable row level security;

create policy "bids_select" on bids for select using (auth.uid() = student_id or auth.uid() in (select client_id from projects where id = project_id));
create policy "bids_insert" on bids for insert with check (auth.uid() = student_id);
create policy "bids_update" on bids for update using (auth.uid() in (select client_id from projects where id = project_id));

-- ─── 4. MILESTONES ──────────────────────────────────────────
create table if not exists milestones (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz default now(),
  project_id       uuid references projects(id) on delete cascade not null,
  title            text not null,
  description      text,
  status           text check (status in ('pending', 'in_progress', 'review', 'completed')) default 'pending',
  submitted_work   text,
  due_date         timestamptz
);

alter table milestones enable row level security;

create policy "milestones_select" on milestones for select using (true);
create policy "milestones_manage" on milestones for all using (auth.uid() in (select client_id from projects where id = project_id) or auth.uid() in (select student_id from bids where project_id = milestones.project_id and status = 'accepted'));

-- ─── 5. REVIEWS ─────────────────────────────────────────────
create table if not exists reviews (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz default now(),
  project_id       uuid references projects(id) on delete cascade not null,
  freelancer_id    uuid references profiles(id) on delete cascade not null,
  client_id        uuid references profiles(id) on delete cascade not null,
  rating           integer check (rating >= 1 and rating <= 5) not null,
  comment          text
);

alter table reviews enable row level security;

create policy "reviews_select" on reviews for select using (true);
create policy "reviews_insert" on reviews for insert with check (auth.uid() = client_id);

-- ─── 6. Enable Realtime ─────────────────────────────────────
alter publication supabase_realtime add table projects;
alter publication supabase_realtime add table profiles;
alter publication supabase_realtime add table bids;
alter publication supabase_realtime add table milestones;
alter publication supabase_realtime add table reviews;
