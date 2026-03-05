---
name: parallel
description: Pre-flight for parallel work — pick items, check file overlap, set statuses, generate terminal commands
user-invocable: true
---

# /parallel — Parallel Work Pre-flight

Prepare 2-3 backlog items for parallel work in separate terminal windows. This skill handles the safety checks and setup — the actual coding happens in independent Claude sessions with full context windows each.

| Invocation | Behaviour |
|---|---|
| `/parallel` | Interactive — pick items from the ready backlog |
| `/parallel BL-044 BL-007` | Pre-flight for the specified items |
| `/parallel --dry-run BL-044 BL-007` | Check file overlap only, no status changes |

---

## Step 1 — Select items

### If items are specified

Validate each BL-NNN:
1. Exists and is open: `gh issue view <number> --repo YanCheng-go/danskprep --json state,title`
2. Not blocked (scan dependencies — see `/backlog` skill for procedure)
3. Not already in-progress

If any item is invalid, report the issue and ask the user to adjust.

### If no items specified

1. Run `/backlog next` logic to get the top 3-5 unblocked ready items
2. Present them and ask the user to pick 2-3:
   ```
   Available for parallel work:
   1. BL-044: Fix feedback submission error [p2/s]
   2. BL-007: Set html lang attribute [p2/xs]
   3. BL-005: Add Content Security Policy headers [p1/s]

   Pick 2-3 items (e.g. "1 2" or "BL-044 BL-007"):
   ```

**Practical limit: 2-3 items.** Beyond 3, human review becomes the bottleneck.

---

## Step 2 — File overlap check

For each selected item, determine the files it will likely touch:

1. Read each issue body for mentioned files/areas
2. Use area labels to infer file patterns:

| Area label | Likely files |
|---|---|
| `area:ui` | `src/components/`, `src/pages/` |
| `area:quiz` | `src/components/quiz/`, `src/lib/quiz-engine.ts`, `src/hooks/useQuiz.ts` |
| `area:vocabulary` | `src/components/vocabulary/`, `src/hooks/useWords.ts`, `src/data/seed/words-*.json` |
| `area:grammar` | `src/components/grammar/`, `src/data/seed/grammar-*.json` |
| `area:db` | `supabase/migrations/`, `src/lib/supabase.ts`, `src/types/database.ts` |
| `area:srs` | `src/lib/fsrs.ts`, `src/hooks/useStudy.ts` |
| `area:auth` | `src/hooks/useAuth.ts`, `src/lib/supabase.ts` |
| `area:dx` | `vite.config.ts`, `package.json`, `.github/`, `flake.nix` |
| `area:analytics` | `src/hooks/useProgress.ts`, `src/pages/ProgressPage.tsx` |
| `area:scraping` | `scripts/` |

3. Check for overlap — files that appear in multiple items' scope
4. **Shared files** that are always safe to touch independently:
   - `package.json` (different deps rarely conflict)
   - `src/App.tsx` routing (adding different routes)
   - `src/types/` (adding new types, not modifying existing)

5. Present the overlap analysis:
   ```
   File overlap check:
   - BL-044 (feedback/db): src/lib/supabase.ts, src/hooks/useFeedback.ts
   - BL-007 (lang attr): src/components/layout/Layout.tsx, index.html

   Overlap: NONE — safe to parallelize
   ```

If overlap is found:
```
WARNING: File overlap detected
- BL-044 and BL-043 both touch src/lib/supabase.ts

Options:
1. Remove one item and pick a different one
2. Proceed anyway (manual merge conflict resolution needed)
3. Cancel
```

For `--dry-run`, stop here and report the analysis.

---

## Step 3 — Set backlog statuses

For each selected item, update status to in-progress:
```bash
gh auth switch --user YanCheng-go
```

Then for each item:
```bash
# Find project item ID
ITEM_ID=$(gh project item-list 15 --owner YanCheng-go --format json --limit 200 | \
  python3 -c "import json,sys; [print(i['id']) for i in json.load(sys.stdin)['items'] if 'BL-NNN' in i.get('title','')]")

# Set to In Progress
gh project item-edit --project-id PVT_kwHOAtALr84BQs_6 --id $ITEM_ID \
  --field-id PVTSSF_lAHOAtALr84BQs_6zg-vxHc --single-select-option-id 47fc9ee4
```

---

## Step 4 — Generate terminal commands

For each item, generate a ready-to-paste `claude` command that starts a worktree session with a focused prompt.

### Command template

```bash
claude -w --resume "BL-NNN" -p "You are working on BL-NNN: <title> (GitHub Issue #<number>).

Issue description: <full issue body>

Files to focus on: <list from overlap analysis>

Workflow:
1. Read the relevant code
2. Implement the fix/feature following CLAUDE.md conventions
3. Write tests if adding new logic
4. Verify: npx tsc --noEmit && npm run build && npx vitest run
5. Run /commit to create a PR with 'Closes #<number>' in the body
6. Stop after PR is created — do not merge

Stay within your file scope. If blocked, stop and explain why."
```

### Launch terminals automatically

Use `osascript` to open new Terminal.app windows and run each command:

```bash
osascript -e 'tell application "Terminal" to do script "cd /Users/yancheng/Documents/Projects/DanishPrep && claude -w --resume \"BL-NNN\" -p \"<prompt>\""'
```

Launch all terminals in parallel (one `osascript` call per item).

After launching, report what was started:

```
## Launched

Opened 2 terminal windows:
- Terminal 1: BL-044 — Fix feedback submission error (worktree)
- Terminal 2: BL-007 — Set html lang attribute (worktree)

Each has its own full context window. When they finish creating PRs,
come back here and say "merge" to review and merge them sequentially.
```

**STOP HERE.** The agents work in their own terminals. The skill resumes when the user returns.

---

## Step 5 — Merge (when user returns)

When the user runs `/parallel merge` or says they're ready:

1. List open PRs from this session:
   ```bash
   gh pr list --repo YanCheng-go/danskprep --author YanCheng-go --json number,title,url,statusCheckRollup --limit 10
   ```

2. Present PR status:
   ```
   ## PRs ready for review

   | # | Title | CI | Action |
   |---|-------|-----|--------|
   | #120 | fix: connect feedback to Supabase | pass | merge? |
   | #121 | fix: set html lang attribute | pass | merge? |

   Reply:
   - "merge all" — merge sequentially
   - "merge #120" — merge one
   - "fix #121 <issue>" — request changes
   ```

3. On approval, merge PRs **sequentially** (one at a time to avoid conflicts):
   ```bash
   gh pr merge <number> --squash --delete-branch
   ```
   Wait for each merge to complete before the next.

4. After all merges, sync local:
   ```bash
   git checkout main && git pull --rebase origin main
   ```

5. Update project board for each closed item (see `/commit` Step 8.7).

6. Report unblocked items and suggest next actions.

---

## Rules

- **Max 3 items** — warn if user requests more
- **No overlapping files** — block by default, require explicit override
- **Sequential merges** — never merge PRs in parallel
- **All PRs need approval** — never auto-merge
- **Always `gh auth switch --user YanCheng-go`** before any gh commands
- **This skill only does pre-flight and post-merge** — actual coding happens in independent terminals with full context windows
