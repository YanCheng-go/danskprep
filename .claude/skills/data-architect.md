# Data Architect

Design, review, and evolve the DanskPrep database schema. Acts as the Data Architect role: ensures schema integrity, migration safety, query performance, and RLS correctness.

## Instructions

Use this skill when:
- Adding a new table or column
- Designing a complex query or index strategy
- Reviewing a migration before it runs in production
- Deciding how to store a new data type (e.g. new inflection pattern, new exercise type)

---

### Step 1 — Review Existing Schema

```bash
cat supabase/migrations/001_initial_schema.sql
ls supabase/migrations/
```

Key tables:
| Table | Purpose | RLS |
|-------|---------|-----|
| `words` | Vocabulary, inflections as JSONB | Public read |
| `grammar_topics` | Grammar explanations by module | Public read |
| `exercises` | Quiz questions, all types | Public read |
| `sentences` | Danish/English pairs | Public read |
| `user_cards` | FSRS state per user per item | Private (user_id) |
| `review_logs` | Review history for analytics | Private (user_id) |

---

### Step 2 — Schema Design Checklist

For any new table, verify:

```sql
-- 1. Primary key
id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

-- 2. Timestamps
created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

-- 3. User ownership (if user-specific data)
user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

-- 4. Foreign key integrity
topic_id UUID REFERENCES grammar_topics(id) ON DELETE SET NULL,

-- 5. Constraints
CHECK (module_level BETWEEN 1 AND 5),
CHECK (exercise_type IN ('type_answer','cloze','multiple_choice','word_order','error_correction','matching','conjugation')),

-- 6. Indexes
CREATE INDEX idx_user_cards_user_id ON user_cards(user_id);
CREATE INDEX idx_user_cards_due ON user_cards(due) WHERE state > 0;
```

---

### Step 3 — RLS Policy Template

```sql
-- Enable RLS
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;

-- Public read (content tables)
CREATE POLICY "public_read" ON new_table
  FOR SELECT USING (true);

-- User-scoped (data tables)
CREATE POLICY "user_select" ON new_table
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_insert" ON new_table
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_update" ON new_table
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "user_delete" ON new_table
  FOR DELETE USING (auth.uid() = user_id);
```

---

### Step 4 — JSONB Inflection Patterns

Inflections are stored as JSONB. Validate new POS patterns against existing conventions:

```typescript
// Noun: { definite, plural_indef, plural_def }
// Verb: { present, past, perfect, imperative }
// Adjective: { t_form, e_form, comparative, superlative }
// Pronoun: { subject, object, possessive: string[] }
```

When adding a new POS, document the JSONB shape in CLAUDE.md.

---

### Step 5 — Migration Safety Review

Before approving a migration, check:

- [ ] **Non-destructive**: No `DROP TABLE`, `DROP COLUMN`, `TRUNCATE` without explicit user confirmation
- [ ] **Backwards-compatible**: New columns have defaults or are nullable
- [ ] **Idempotent**: Migration can be re-run safely (use `IF NOT EXISTS`, `IF EXISTS`)
- [ ] **Index naming**: Follow pattern `idx_{table}_{column(s)}`
- [ ] **File naming**: `00N_description.sql` — never modify existing migration files
- [ ] **Test locally**: `supabase db reset` before pushing

---

### Step 6 — Query Performance Review

For any new query in hooks, evaluate:
- Does it use an indexed column in `WHERE` / `ORDER BY`?
- Does it select only needed columns (avoid `SELECT *`)?
- Does it paginate if result set could be large?
- Does it use `.single()` only when exactly one row is guaranteed?

---

### Output Format

```
## Data Architecture Review — <Feature>

### Schema changes
(tables / columns / indexes being added or modified)

### Migration SQL
\`\`\`sql
-- Proposed migration: 00N_description.sql
\`\`\`

### RLS policies
(list all policies for new/modified tables)

### Query patterns
(new queries added to hooks, with performance notes)

### Concerns
- [CONCERN] Description → resolution

### Decision
✓ Approved / ⚠ Approved with changes / ✗ Needs redesign
```
