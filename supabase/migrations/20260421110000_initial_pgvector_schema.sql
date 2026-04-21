-- Enable pgvector extension securely
create extension if not exists vector
with
  schema extensions;

-- Create projects (contexts) table
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  summary text,
  business_model text,
  tech_spec text,
  ip_strategy text,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.projects enable row level security;

-- Create policies
create policy "Users can view their own projects"
  on public.projects for select using (
    auth.uid() = user_id
  );

create policy "Users can insert their own projects"
  on public.projects for insert with check (
    auth.uid() = user_id
  );

create policy "Users can update their own projects"
  on public.projects for update using (
    auth.uid() = user_id
  );

-- Create project_vectors for RAG mechanism
create table if not exists public.project_vectors (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  content text not null, -- The raw chunk content
  embedding vector(1536) not null, -- 1536 is standard for OpenAI text-embedding-3-small/ada-002
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.project_vectors enable row level security;

-- Secure vector retrieval policies based on project ownership
create policy "Users can view vectors for their own projects"
  on public.project_vectors for select using (
    exists (
      select 1 from public.projects
      where projects.id = project_vectors.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can insert vectors for their own projects"
  on public.project_vectors for insert with check (
    exists (
      select 1 from public.projects
      where projects.id = project_id
      and projects.user_id = auth.uid()
    )
  );

-- Vector similarity search matching function
create or replace function match_project_vectors(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_project_id uuid default null
)
returns table (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    pv.id,
    pv.content,
    pv.metadata,
    1 - (pv.embedding <=> query_embedding) as similarity
  from project_vectors pv
  join projects p on p.id = pv.project_id
  where p.user_id = auth.uid() -- enforce RLS layer conceptually in function 
    and (filter_project_id is null or pv.project_id = filter_project_id)
    and 1 - (pv.embedding <=> query_embedding) > match_threshold
  order by pv.embedding <=> query_embedding
  limit match_count;
end;
$$;
