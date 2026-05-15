create policy "Users can update their own messages"
  on public.messages for update using (
    auth.uid() = user_id
  );
