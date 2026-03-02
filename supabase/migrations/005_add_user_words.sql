-- User-added vocabulary words (private per user)
create table user_words (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  danish text not null,
  english text not null,
  part_of_speech text not null default 'noun',
  gender text check (gender in ('en', 'et')),
  module_level int not null default 3,
  difficulty int default 1,
  tags text[] default '{}',
  inflections jsonb,
  example_da text,
  example_en text,
  source text default 'user-added',
  created_at timestamptz default now(),
  unique(user_id, danish)
);

alter table user_words enable row level security;

-- Users can only manage their own words
create policy "user_words_own" on user_words
  for all using (auth.uid() = user_id);
