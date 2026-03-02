create table feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  exercise_id text,
  type text not null,
  message text not null,
  created_at timestamptz default now()
);

alter table feedback enable row level security;

-- Allow anyone (including anonymous/unauthenticated users) to submit feedback
create policy "feedback_insert" on feedback
  for insert with check (true);

-- Users can only read their own feedback; anonymous feedback is write-only
create policy "feedback_select" on feedback
  for select using (auth.uid() = user_id);
