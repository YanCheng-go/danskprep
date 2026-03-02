---
globs:
  - "src/lib/supabase.ts"
  - "src/hooks/**/*.ts"
  - "supabase/**/*.sql"
  - "scripts/**/*.py"
---

# Supabase Access Patterns

## Client Usage
- Import the singleton client from `src/lib/supabase.ts` — never create a new client elsewhere
- Use typed queries: always import and apply the generated types from `src/types/database.ts`
- Environment variables: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from `.env.local` — never hardcode

## Database Type Generic — Critical Pitfall
**Problem**: `createClient<Database>()` with a hand-written `Database` type resolves all table `Insert`/`Update` types to `never` if the type structure doesn't exactly match Supabase JS v2's internal expectations. This causes errors like:
```
Argument of type '{...}' is not assignable to parameter of type 'never'
```

**Root cause**: The `Database` generic requires `Views`, `Functions`, `Enums`, `CompositeTypes` sections with exact shapes, plus `Relationships: []` on every table. Any mismatch silently collapses types to `never`.

**Solutions (in order of preference):**
1. **Generate proper types** (best): Connect to Supabase and run `npm run types` (`supabase gen types typescript --linked > src/types/database.ts`). Replace the hand-written file.
2. **Use untyped client** (pragmatic for early dev): `createClient<any>(url, key)` — add a comment explaining it's temporary.
3. **Never write the Database type by hand** unless you verify every field matches the generated output exactly.

**The untyped client approach** (used in this project until real types are generated):
```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase = createClient<any>(supabaseUrl, supabaseAnonKey)
```
When using `any`, add explicit type casts at query call sites to preserve safety:
```typescript
const { data } = await supabase.from('user_cards').select('state').eq('user_id', userId)
const cards = (data ?? []) as Pick<UserCard, 'state'>[]
```

## Row Level Security (RLS)
- **RLS is enabled on all tables** — every query runs as the authenticated user
- `user_cards` and `review_logs`: users can only read/write their own rows (filtered by `user_id = auth.uid()`)
- `words`, `grammar_topics`, `exercises`, `sentences`: public read, no writes from frontend
- Never bypass RLS with the service role key in client-side code

### UPDATE policies must have WITH CHECK
PostgreSQL RLS has two clauses for UPDATE:
- `USING` — filters which rows the user can **read/access** (row selection, before update)
- `WITH CHECK` — validates what values are allowed in the **new row** (after update)

Without `WITH CHECK`, a user who matches a row via `USING` can change any column to any value — including `user_id`, effectively hijacking the row. Always mirror the `USING` constraint in `WITH CHECK`:

```sql
-- WRONG: user can change user_id to steal the row
CREATE POLICY "user_update" ON my_table
  FOR UPDATE USING (auth.uid() = user_id);

-- CORRECT: new values must also satisfy ownership
CREATE POLICY "user_update" ON my_table
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

## Query Patterns
```typescript
// Prefer: typed select with explicit columns
const { data, error } = await supabase
  .from('words')
  .select('id, danish, english, part_of_speech, inflections')
  .eq('module_level', 2)
  .order('danish');

// Always handle errors
if (error) throw error;
```

- Always handle `error` from every Supabase call — never silently ignore it
- Use `.single()` only when you are certain exactly one row exists; prefer `.maybeSingle()` otherwise
- Batch inserts use `.insert([...array])` — don't loop individual inserts

## Migrations
- All schema changes go in `supabase/migrations/` as numbered SQL files (`002_add_column.sql`)
- Never modify `001_initial_schema.sql` after initial deploy — always add new migrations
- Test migrations locally with Supabase CLI before pushing

## Real-time
- Not used in MVP — do not add real-time subscriptions without explicit discussion
