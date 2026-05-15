alter table public.messages add column if not exists is_archived boolean default false not null;
create index if not exists messages_is_archived_idx on public.messages(is_archived);
