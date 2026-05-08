-- Run this in your Supabase SQL Editor to add the missing columns
alter table projects add column if not exists timeline text;
alter table projects add column if not exists tech_stack text[];
