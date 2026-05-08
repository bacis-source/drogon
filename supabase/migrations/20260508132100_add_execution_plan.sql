-- Add execution_plan JSONB column to projects table
alter table public.projects
add column if not exists execution_plan jsonb default '[]'::jsonb;
