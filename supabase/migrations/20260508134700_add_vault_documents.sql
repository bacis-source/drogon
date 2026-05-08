create table public.vault_documents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  project_id uuid references public.projects on delete cascade not null,
  filename text not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.vault_documents enable row level security;

create policy "Users can view own vault documents"
  on public.vault_documents for select
  using ( auth.uid() = user_id );

create policy "Users can insert own vault documents"
  on public.vault_documents for insert
  with check ( auth.uid() = user_id );

create policy "Users can delete own vault documents"
  on public.vault_documents for delete
  using ( auth.uid() = user_id );
