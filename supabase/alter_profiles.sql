-- Run this in the Supabase SQL Editor to add the new fields required for Phase 1
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS linkedin_url text,
ADD COLUMN IF NOT EXISTS social_links text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS work_samples text[] DEFAULT '{}';
