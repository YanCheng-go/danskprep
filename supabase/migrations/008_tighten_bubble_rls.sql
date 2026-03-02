-- Tighten bubble_scores RLS policies
-- Previously: insert/update used `with check (true)` / `using (true)` — anyone could
-- insert with arbitrary user_id or update any row. Now: enforce ownership.

drop policy if exists "bubble_scores_insert" on bubble_scores;
drop policy if exists "bubble_scores_update" on bubble_scores;

-- Insert: signed-in users must set their own user_id; guests must be null + is_guest
create policy "bubble_scores_insert" on bubble_scores for insert with check (
  (auth.uid() is not null and user_id = auth.uid())
  or (auth.uid() is null and user_id is null and is_guest = true)
);

-- Update: signed-in users can only update their own rows; guests can only update guest rows
create policy "bubble_scores_update" on bubble_scores for update using (
  (auth.uid() is not null and user_id = auth.uid())
  or (auth.uid() is null and is_guest = true and user_id is null)
);

-- Ensure updated_at is not nullable (used in ORDER BY for session restore)
alter table bubble_scores alter column updated_at set not null;
