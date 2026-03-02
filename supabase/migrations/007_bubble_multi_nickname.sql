-- Allow multiple leaderboard entries per signed-in user (one per nickname)
-- Previously: one row per user_id. Now: one row per (user_id, nickname) pair.
drop index if exists bubble_scores_user_unique;

-- One row per (user_id, nickname) pair
create unique index bubble_scores_user_nickname_unique
  on bubble_scores (user_id, nickname) where user_id is not null;

-- Fast lookup of user's most recent entry
create index bubble_scores_user_latest
  on bubble_scores (user_id, updated_at desc) where user_id is not null;
