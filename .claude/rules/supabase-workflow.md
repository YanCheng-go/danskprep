# Supabase Workflow — Auto-sync Migrations

## Rule: Run `/supabase-sync` after creating migration files

Whenever you create or add a new migration file in `supabase/migrations/`, you MUST run the `/supabase-sync` skill before considering the task complete.

This ensures the remote Supabase database stays in sync with the local migration files.

### Workflow

1. Create the new migration file (`supabase/migrations/NNN_description.sql`)
2. Update `supabase/apply-all-migrations.sql` to include the new migration
3. Run `/supabase-sync` — the skill only pushes **pending** migrations (the CLI skips already-applied ones automatically)
4. Only after a successful push, mark the migration work as done

### Important

- The CLI tracks applied migrations — it will never re-run old ones
- If the user declines to sync now, note it as a pending action
- Use `/supabase-sync` for all migration pushes — do not run raw `supabase db push` outside the skill
