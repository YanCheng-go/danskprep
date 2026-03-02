-- Bubble game leaderboard
-- Supports both guest (anonymous) and signed-in users
create table bubble_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  nickname text not null,
  score int not null default 0,
  is_guest boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Signed-in users get one leaderboard entry per user_id
create unique index bubble_scores_user_unique on bubble_scores (user_id) where user_id is not null;
-- Guests get one entry per nickname (among guests only)
create unique index bubble_scores_guest_unique on bubble_scores (nickname) where is_guest = true;

alter table bubble_scores enable row level security;

-- Anyone can read the leaderboard
create policy "bubble_scores_read" on bubble_scores for select using (true);
-- Anyone can insert (guest-friendly)
create policy "bubble_scores_insert" on bubble_scores for insert with check (true);
-- Anyone can update their own entry
create policy "bubble_scores_update" on bubble_scores for update using (true);
-- Signed-in users can delete their own entries
create policy "bubble_scores_delete" on bubble_scores for delete using (auth.uid() = user_id);

-- Nickname history for signed-in users (tracks all nickname changes)
create table bubble_nickname_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nickname text not null,
  created_at timestamptz default now()
);

alter table bubble_nickname_history enable row level security;

create policy "nickname_history_read_own" on bubble_nickname_history for select using (auth.uid() = user_id);
create policy "nickname_history_insert_own" on bubble_nickname_history for insert with check (auth.uid() = user_id);
