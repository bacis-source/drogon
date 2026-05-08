-- Add tech_architecture JSONB column to projects table
alter table public.projects
add column if not exists tech_architecture jsonb default '{}'::jsonb;
