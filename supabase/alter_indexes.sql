-- ============================================================
-- PERFORMANCE OPTIMIZATION: Database Indexes
-- Run this in Supabase SQL Editor to make the platform blazing fast
-- ============================================================

-- 1. Optimize Talent Board Fetching
-- Speeds up the "fetch recent profiles" query on the landing page
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);

-- 2. Optimize Profile Page Lookups
-- Speeds up queries like "where client_id = X" and "where freelancer_id = X"
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON public.projects(client_id);
CREATE INDEX IF NOT EXISTS idx_reviews_freelancer_id ON public.reviews(freelancer_id);

-- 3. Optimize Project Dashboards (Phase 3 Prep)
-- Speeds up finding bids and milestones for specific projects
CREATE INDEX IF NOT EXISTS idx_bids_project_id ON public.bids(project_id);
CREATE INDEX IF NOT EXISTS idx_milestones_project_id ON public.milestones(project_id);

-- 4. Fast Text Search for AI Chatbot
-- Allows the AI Chatbot to rapidly search profiles by skills
CREATE INDEX IF NOT EXISTS idx_profiles_skills ON public.profiles USING GIN(skills);
