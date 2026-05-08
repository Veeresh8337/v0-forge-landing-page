-- Add github_repos column to store public repositories
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS github_repos jsonb DEFAULT '[]'::jsonb;
