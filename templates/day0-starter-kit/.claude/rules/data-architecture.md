# Data Architecture

## ID Strategy

<!-- CUSTOMIZE: Choose your strategy and delete this comment -->

All entities must have a stable, deterministic ID assigned at creation time.

**Pattern:** `sha256(source + type + content)[:12]`

This ensures:
- IDs survive re-imports and re-processing
- No user_card / review_log references break on content updates
- Seed data can be diffed meaningfully

**Rules:**
- Never use array indices as IDs
- Never rely on auto-increment for content that may be re-seeded
- Assign IDs in the data pipeline, not at insert time

## Data Flow

<!-- CUSTOMIZE: Choose API-first or bundled and delete this comment -->

Content flows: **seed JSON → database → app fetches at runtime**

- Seed JSON files are the source of truth for initial content
- The app reads from the database at runtime (not bundled JSON)
- Seed JSON serves as bootstrap data and offline fallback only
- Content updates do NOT require a frontend redeploy

## Seed Data Format

- All seed files live in `src/data/seed/`
- File naming: `{entity}-{scope}.json` (e.g., `exercises-pd3m2.json`)
- Every record has a `source` field for provenance tracking
- UTF-8 encoding, literal special characters (no escaped unicode)

## Migration Workflow

1. Create new migration file: `supabase/migrations/NNN_description.sql`
2. Never modify existing migration files
3. Run sync to push to remote database
4. Generate types if schema changed
