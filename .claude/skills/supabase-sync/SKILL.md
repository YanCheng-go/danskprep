---
name: supabase-sync
description: Push database migrations and seed data to Supabase
user-invocable: true
---

# Supabase Sync

Push database migrations and seed data to the Supabase project.

> **Reference:** Read `.claude/references/supabase-patterns.md` for client usage, RLS patterns, and query conventions.

## Prerequisites

- Supabase CLI available via Nix (`flake.nix` includes `supabase-cli`)
- `.env.local` contains `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Project ref: extract from `VITE_SUPABASE_URL` (the subdomain before `.supabase.co`)

## Instructions

### Step 0 — Ensure CLI is authenticated

Always check auth first. If not authenticated, run `supabase login` and **wait for user confirmation** before proceeding — the login opens a browser and requires interactive approval.

```bash
# Check if authenticated (will fail if not)
supabase projects list 2>&1 | head -5

# If "Access token not provided" error, run login:
supabase login
# ⏳ STOP — wait for user to confirm they have logged in before continuing
```

### Step 1 — Ensure CLI is linked

Check if the project is already linked:

```bash
cat supabase/.temp/project-ref 2>/dev/null || echo "NOT LINKED"
```

If not linked, extract the project ref and link:

```bash
# Extract project ref from .env.local
PROJECT_REF=$(grep 'VITE_SUPABASE_URL' .env.local | awk -F'https://' '{print $2}' | awk -F'.supabase' '{print $1}')

# Link (will prompt for database password)
supabase link --project-ref "$PROJECT_REF"
```

> **Note:** The `supabase link` command requires the database password (set when creating the Supabase project, not the anon key). The user will be prompted interactively.

### Step 2 — Push migrations

```bash
# Dry run first — shows what will be applied
supabase db push --dry-run

# Apply pending migrations (use `yes |` to auto-confirm)
yes | supabase db push
```

This applies all files in `supabase/migrations/` in order (001–NNN), skipping any already applied. The CLI tracks applied migrations via Supabase's internal `schema_migrations` table.

**If migrations were previously applied via SQL Editor** but the CLI doesn't know about them, use `supabase migration repair` to mark them:

```bash
# Mark a migration as already applied (skip it)
supabase migration repair --status applied 001

# Mark a migration as not applied (so it gets pushed)
supabase migration repair --status reverted 008
```

### Step 3 — Seed the database (optional)

Only run this if the user explicitly requests seeding or if this is a fresh database:

```bash
cd scripts && uv run python seed-database.py
```

Requires `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` environment variables (the **service role** key, not the anon key — find it in Supabase dashboard → Settings → API).

```bash
export SUPABASE_URL=https://<ref>.supabase.co
export SUPABASE_SERVICE_KEY=<service-role-key>
cd scripts && uv run python seed-database.py
```

### Step 4 — Generate TypeScript types (optional)

After migrations are applied, generate typed client:

```bash
npm run types
```

This runs `supabase gen types typescript --linked > src/types/database.ts`. After generating, update `src/lib/supabase.ts` to replace `createClient<any>()` with `createClient<Database>()`.

## Quick mode

For a quick sync after adding a new migration:

```bash
supabase db push --dry-run   # verify
yes | supabase db push        # apply
```

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `Access token not provided` | Run `supabase login` — wait for user to confirm |
| `NOT LINKED` | Run Step 1 to link the project |
| `supabase: command not found` | Ensure `.envrc` is allowed (`direnv allow`) — supabase-cli is in `flake.nix` |
| `Permission denied` / auth error | Re-run `supabase login` to refresh auth token |
| `already exists` during push | Tables exist from SQL Editor — use `supabase migration repair --status applied NNN` |
| Migration already applied | Safe to ignore — CLI skips applied migrations |
| Seed script fails after delete | Data lost — re-run seed script; see error handling in `seed-database.py` |
| `createClient<any>` type warnings | Run Step 4 to generate real DB types |

### Step 5 — Update NOTES.md

After a successful push, update `NOTES.md` to record which migrations have been applied:
- In section **4. Connect Supabase**, update the migration range (e.g., "Migrations 001-009 applied")
- If a new migration was just created and pushed, add it to the current session's completed items in the **Completed** section

## Reminders

- Never commit `.env.local` or service role keys
- Always dry-run before pushing migrations to catch SQL errors
- The `apply-all-migrations.sql` file is a convenience copy for manual SQL Editor use — the CLI uses the individual files in `supabase/migrations/`
- After adding a new migration file, update `apply-all-migrations.sql` to stay in sync
- After a successful sync, update `NOTES.md` to track applied migration state
