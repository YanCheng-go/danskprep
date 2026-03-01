-- DanskPrep Initial Schema
-- Run this via: supabase db push, or paste into Supabase SQL Editor

-- ─── Enable extensions ───────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Words ──────────────────────────────────────────────────────────────────
create table if not exists words (
  id            uuid primary key default uuid_generate_v4(),
  danish        text not null,
  english       text not null,
  part_of_speech text not null check (part_of_speech in (
    'noun','verb','adjective','adverb','pronoun','preposition','conjunction','interjection'
  )),
  gender        text check (gender in ('en','et')),
  module_level  int not null default 2,
  difficulty    int not null default 1 check (difficulty between 1 and 3),
  tags          text[] not null default '{}',
  inflections   jsonb,
  example_da    text,
  example_en    text,
  source        text not null default 'manual',
  created_at    timestamptz not null default now()
);

create index if not exists words_module_level_idx on words(module_level);
create index if not exists words_danish_idx on words(danish);

-- ─── Grammar Topics ─────────────────────────────────────────────────────────
create table if not exists grammar_topics (
  id              uuid primary key default uuid_generate_v4(),
  title           text not null,
  slug            text not null unique,
  module_level    int not null default 2,
  category        text not null,
  explanation     text not null,
  rules           jsonb not null default '[]',
  tips            jsonb not null default '[]',
  common_mistakes jsonb not null default '[]',
  sort_order      int not null default 0,
  created_at      timestamptz not null default now()
);

create index if not exists grammar_topics_module_idx on grammar_topics(module_level);

-- ─── Exercises ───────────────────────────────────────────────────────────────
create table if not exists exercises (
  id                 uuid primary key default uuid_generate_v4(),
  grammar_topic_slug text references grammar_topics(slug) on delete set null,
  word_id            uuid references words(id) on delete set null,
  exercise_type      text not null check (exercise_type in (
    'type_answer','cloze','multiple_choice','word_order',
    'error_correction','matching','conjugation'
  )),
  question           text not null,
  correct_answer     text not null,
  acceptable_answers text[] not null default '{}',
  alternatives       text[],
  hint               text,
  explanation        text,
  module_level       int not null default 2,
  difficulty         int not null default 1 check (difficulty between 1 and 3),
  source             text not null default 'generated',
  created_at         timestamptz not null default now()
);

create index if not exists exercises_topic_idx on exercises(grammar_topic_slug);
create index if not exists exercises_type_idx on exercises(exercise_type);
create index if not exists exercises_module_idx on exercises(module_level);

-- ─── Sentences ───────────────────────────────────────────────────────────────
create table if not exists sentences (
  id                 uuid primary key default uuid_generate_v4(),
  danish             text not null,
  english            text not null,
  grammar_topic_slug text references grammar_topics(slug) on delete set null,
  module_level       int not null default 2,
  difficulty         int not null default 1 check (difficulty between 1 and 3),
  cloze_word         text,
  cloze_answer       text,
  source             text not null default 'generated',
  created_at         timestamptz not null default now()
);

-- ─── User Cards (FSRS state) ─────────────────────────────────────────────────
create table if not exists user_cards (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  content_type    text not null check (content_type in ('word','exercise','sentence')),
  content_id      text not null,
  -- FSRS fields
  state           int not null default 0 check (state between 0 and 3),
  due             timestamptz not null default now(),
  stability       float8 not null default 0,
  difficulty      float8 not null default 0,
  elapsed_days    int not null default 0,
  scheduled_days  int not null default 0,
  reps            int not null default 0,
  lapses          int not null default 0,
  last_review     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id, content_type, content_id)
);

create index if not exists user_cards_user_idx on user_cards(user_id);
create index if not exists user_cards_due_idx on user_cards(user_id, due, state);

-- ─── Review Logs ─────────────────────────────────────────────────────────────
create table if not exists review_logs (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  card_id      uuid not null references user_cards(id) on delete cascade,
  rating       int not null check (rating between 1 and 4),
  response     text,
  was_correct  boolean,
  time_taken_ms int,
  reviewed_at  timestamptz not null default now()
);

create index if not exists review_logs_user_idx on review_logs(user_id, reviewed_at);
create index if not exists review_logs_card_idx on review_logs(card_id);

-- ─── Row Level Security ───────────────────────────────────────────────────────

-- Public content: readable by anyone (including anon)
alter table words enable row level security;
alter table grammar_topics enable row level security;
alter table exercises enable row level security;
alter table sentences enable row level security;

create policy "words_public_read" on words for select using (true);
create policy "grammar_topics_public_read" on grammar_topics for select using (true);
create policy "exercises_public_read" on exercises for select using (true);
create policy "sentences_public_read" on sentences for select using (true);

-- User cards: users can only access their own
alter table user_cards enable row level security;

create policy "user_cards_select" on user_cards
  for select using (auth.uid() = user_id);

create policy "user_cards_insert" on user_cards
  for insert with check (auth.uid() = user_id);

create policy "user_cards_update" on user_cards
  for update using (auth.uid() = user_id);

create policy "user_cards_delete" on user_cards
  for delete using (auth.uid() = user_id);

-- Review logs: users can only access their own
alter table review_logs enable row level security;

create policy "review_logs_select" on review_logs
  for select using (auth.uid() = user_id);

create policy "review_logs_insert" on review_logs
  for insert with check (auth.uid() = user_id);
