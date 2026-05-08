-- Add lean_canvas JSONB column to projects table
alter table public.projects
add column if not exists lean_canvas jsonb default '{}'::jsonb;
