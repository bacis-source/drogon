-- Create messages table for persistent chat history
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant', 'system', 'data')),
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.messages enable row level security;

-- Create policies for messages
create policy "Users can view their own messages"
  on public.messages for select using (
    auth.uid() = user_id
  );

create policy "Users can insert their own messages"
  on public.messages for insert with check (
    auth.uid() = user_id
  );

-- Indexes for fast querying by user
create index if not exists messages_user_id_idx on public.messages(user_id);
create index if not exists messages_created_at_idx on public.messages(created_at);
