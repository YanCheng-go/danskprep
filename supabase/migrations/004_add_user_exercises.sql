-- User-submitted exercises (stored per user)
create table user_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  grammar_topic_slug text,
  exercise_type text not null,
  question text not null,
  correct_answer text not null,
  acceptable_answers text[] default '{}',
  alternatives text[],
  hint text,
  explanation text,
  module_level int not null,
  difficulty int default 1,
  shared boolean default false,
  created_at timestamptz default now(),
  unique(user_id, question)
);

alter table user_exercises enable row level security;

-- Users can manage their own exercises
create policy "user_exercises_own" on user_exercises
  for all using (auth.uid() = user_id);

-- Anyone can read shared exercises
create policy "user_exercises_shared_read" on user_exercises
  for select using (shared = true);
