-- DanskPrep: Combined migrations (001–007)
-- Run this in the Supabase SQL Editor to set up all tables.
-- Safe to re-run: uses IF NOT EXISTS and will skip existing objects.

-- ═══ Migration 001: Initial Schema ══════════════════════════════════════════

create extension if not exists "uuid-ossp";

-- Words
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

-- Grammar Topics
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

-- Exercises
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

-- Sentences
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

-- User Cards (FSRS state)
create table if not exists user_cards (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  content_type    text not null check (content_type in ('word','exercise','sentence')),
  content_id      text not null,
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

-- Review Logs
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

-- RLS: Public content
alter table words enable row level security;
alter table grammar_topics enable row level security;
alter table exercises enable row level security;
alter table sentences enable row level security;

do $$ begin
  create policy "words_public_read" on words for select using (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "grammar_topics_public_read" on grammar_topics for select using (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "exercises_public_read" on exercises for select using (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "sentences_public_read" on sentences for select using (true);
exception when duplicate_object then null;
end $$;

-- RLS: User cards
alter table user_cards enable row level security;

do $$ begin
  create policy "user_cards_select" on user_cards for select using (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "user_cards_insert" on user_cards for insert with check (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "user_cards_update" on user_cards for update using (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "user_cards_delete" on user_cards for delete using (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

-- RLS: Review logs
alter table review_logs enable row level security;

do $$ begin
  create policy "review_logs_select" on review_logs for select using (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "review_logs_insert" on review_logs for insert with check (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;


-- ═══ Migration 002: Unique constraint ═══════════════════════════════════════

do $$ begin
  alter table words add constraint words_danish_pos_unique unique (danish, part_of_speech);
exception when duplicate_object then null;
end $$;


-- ═══ Migration 003: Feedback table ══════════════════════════════════════════

create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  exercise_id text,
  type text not null,
  message text not null,
  created_at timestamptz default now()
);

alter table feedback enable row level security;

-- Anyone can submit feedback (including anonymous users)
do $$ begin
  create policy "feedback_insert" on feedback for insert with check (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "feedback_select" on feedback for select using (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;


-- ═══ Migration 004: User exercises ══════════════════════════════════════════

create table if not exists user_exercises (
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

do $$ begin
  create policy "user_exercises_own" on user_exercises for all using (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "user_exercises_shared_read" on user_exercises for select using (shared = true);
exception when duplicate_object then null;
end $$;


-- ═══ Migration 005: User words ══════════════════════════════════════════════

create table if not exists user_words (
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

do $$ begin
  create policy "user_words_own" on user_words for all using (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;


-- ═══ Migration 006: Bubble leaderboard ═══════════════════════════════════════

create table if not exists bubble_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  nickname text not null,
  score int not null default 0,
  is_guest boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Guests get one entry per nickname (among guests only)
create unique index if not exists bubble_scores_guest_unique
  on bubble_scores (nickname) where is_guest = true;

alter table bubble_scores enable row level security;

do $$ begin
  create policy "bubble_scores_read" on bubble_scores for select using (true);
exception when duplicate_object then null;
end $$;
do $$ begin
  create policy "bubble_scores_insert" on bubble_scores for insert with check (
    (auth.uid() is not null and user_id = auth.uid())
    or (auth.uid() is null and user_id is null and is_guest = true)
  );
exception when duplicate_object then null;
end $$;
do $$ begin
  create policy "bubble_scores_update" on bubble_scores for update using (
    (auth.uid() is not null and user_id = auth.uid())
    or (auth.uid() is null and is_guest = true and user_id is null)
  );
exception when duplicate_object then null;
end $$;
do $$ begin
  create policy "bubble_scores_delete" on bubble_scores for delete using (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

create table if not exists bubble_nickname_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nickname text not null,
  created_at timestamptz default now()
);

alter table bubble_nickname_history enable row level security;

do $$ begin
  create policy "nickname_history_read_own" on bubble_nickname_history for select using (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;
do $$ begin
  create policy "nickname_history_insert_own" on bubble_nickname_history for insert with check (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;


-- ═══ Migration 007: Bubble multi-nickname ════════════════════════════════════

-- Allow multiple leaderboard entries per signed-in user (one per nickname)
-- Previously: one row per user_id. Now: one row per (user_id, nickname) pair.
drop index if exists bubble_scores_user_unique;

create unique index if not exists bubble_scores_user_nickname_unique
  on bubble_scores (user_id, nickname) where user_id is not null;

create index if not exists bubble_scores_user_latest
  on bubble_scores (user_id, updated_at desc) where user_id is not null;


-- ═══ Migration 008: Tighten bubble_scores RLS ════════════════════════════════

-- Drop old permissive policies and recreate with ownership checks
-- (already replaced inline above in the 006 section)

-- Ensure updated_at is not nullable (used in ORDER BY for session restore)
alter table bubble_scores alter column updated_at set not null;
