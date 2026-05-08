-- ============================================================
-- SQL Migration for All Phases (Profiles, Milestones, Reviews)
-- Run this completely in your Supabase SQL Editor
-- ============================================================

-- 1. ADD NEW PROFILE FIELDS (if not already added)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS linkedin_url text,
ADD COLUMN IF NOT EXISTS social_links text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS work_samples text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS phone_number text,
ADD COLUMN IF NOT EXISTS total_reviews integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS average_rating numeric(3,2) DEFAULT 0.00;

-- 2. CREATE MILESTONES TABLE
CREATE TABLE IF NOT EXISTS public.milestones (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz default now(),
  project_id       uuid references projects(id) on delete cascade not null,
  title            text not null,
  description      text,
  status           text check (status in ('pending', 'in_progress', 'review', 'completed')) default 'pending',
  submitted_work   text,
  due_date         timestamptz
);

ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "milestones_select" ON public.milestones FOR SELECT USING (true);
CREATE POLICY "milestones_manage" ON public.milestones FOR ALL USING (
  auth.uid() IN (SELECT client_id FROM projects WHERE id = project_id) OR 
  auth.uid() IN (SELECT student_id FROM bids WHERE project_id = milestones.project_id AND status = 'accepted')
);

-- 3. CREATE REVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.reviews (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz default now(),
  project_id       uuid references projects(id) on delete cascade not null,
  freelancer_id    uuid references profiles(id) on delete cascade not null,
  client_id        uuid references profiles(id) on delete cascade not null,
  rating           integer check (rating >= 1 and rating <= 5) not null,
  comment          text
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews_select" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = client_id);

-- 4. ENABLE REALTIME FOR NEW TABLES
ALTER PUBLICATION supabase_realtime ADD TABLE milestones;
ALTER PUBLICATION supabase_realtime ADD TABLE reviews;
