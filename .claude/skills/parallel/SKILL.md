---
name: parallel
description: Run multiple coder agents in parallel on non-overlapping backlog items using isolated worktrees
user-invocable: true
---

# /parallel — Parallel Agent Coordinator

Spawn multiple coder agents working on separate backlog items simultaneously, each in an isolated git worktree. The coordinator (this skill) owns all backlog updates and conflict checks — agents only code, test, commit, and push.

| Invocation | Behaviour |
|---|---|
| `/parallel` | Interactive — pick items from the ready backlog |
| `/parallel BL-044 BL-007` | Run agents on the specified items |
| `/parallel --dry-run BL-044 BL-007` | Check file overlap only, don't spawn agents |

---

## Step 1 — Select items

### If items are specified

Validate each BL-NNN:
1. Exists and is open: `gh issue view <number> --repo YanCheng-go/danskprep --json state,title`
2. Not blocked (scan dependencies — see `/backlog` skill for procedure)
3. Not already in-progress

If any item is invalid, report the issue and ask the user to adjust.

### If no items specified

1. Run `/backlog next` logic to get the top 3 unblocked ready items
2. Present them and ask the user to pick 2-3:
   ```
   Available for parallel work:
   1. BL-044: Fix feedback submission error [p2/s]
   2. BL-007: Set html lang attribute [p2/xs]
   3. BL-005: Add Content Security Policy headers [p1/s]

   Pick 2-3 items (e.g. "1 2" or "BL-044 BL-007"):
   ```

**Practical limit: 2-3 items max.** Beyond 3, human review becomes the bottleneck and context quality drops. Warn the user if they select more than 3.

---

## Step 2 — File overlap check

For each selected item, determine the files it will likely touch. Use a lightweight scope analysis:

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

   Proceed?
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

## Step 4 — Spawn agents

Launch one `coder` agent per item, each with `isolation: "worktree"`. All agents launch in a single message (parallel).

### Agent brief template

Each agent receives this prompt (fill in the blanks per item):

```
You are a coder agent working on a single backlog item in an isolated worktree.

## Your assignment
- Item: BL-NNN — <title>
- GitHub Issue: #<number>
- Priority: <priority> | Effort: <effort>
- Issue description: <full issue body>

## Your scope
Files you should focus on:
<list of files from overlap analysis>

## Your workflow
1. Read the relevant code to understand the current state
2. Implement the fix/feature following project conventions (see CLAUDE.md, .claude/rules/)
3. Write tests if adding new logic
4. Verify: `npx tsc --noEmit && npm run build && npx vitest run`
5. Commit with a clear message explaining why (not what):
   ```
   git add <specific files>
   git commit -m "<type>: <message>

   Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
   ```
6. Create a feature branch and push:
   ```
   gh auth switch --user YanCheng-go
   git checkout -b <type>/BL-NNN-<short-slug>
   git push -u origin <type>/BL-NNN-<short-slug>
   ```
7. Create a PR:
   ```
   gh pr create --title "<type>: <description>" --body "$(cat <<'EOF'
   ## Summary
   - <what and why>

   ## Backlog
   - Closes #<issue_number> <!-- BL-NNN: title -->

   ## Test plan
   - [ ] `npx tsc --noEmit` + `npm run build` + `npx vitest run`
   - [ ] <specific verification>

   🤖 Generated with [Claude Code](https://claude.com/claude-code)
   EOF
   )"
   ```

## Rules
- Do NOT run /backlog, /commit, /retro, or /release — the coordinator handles those
- Do NOT merge the PR — just create it and stop
- Do NOT modify files outside your scope unless absolutely necessary
- If you hit a blocker, document it in your final report and stop
- Always run the full quality gate before pushing

## Final report
When done, report back with:
- PR URL (or "no PR" if blocked)
- Files changed (list)
- Tests added/modified
- Any blockers or concerns
```

### Launching

Use the `Agent` tool with these parameters for each item:
- `subagent_type: "coder"`
- `isolation: "worktree"`
- `run_in_background: true`
- `description: "BL-NNN: <short title>"`
- `prompt: <filled agent brief>`

Launch ALL agents in a single message to maximize parallelism:

```
Spawning 2 agents:
- Agent 1: BL-044 — Fix feedback submission error (worktree)
- Agent 2: BL-007 — Set html lang attribute (worktree)

Working in background. I'll report results when they complete.
```

---

## Step 5 — Collect results

As each agent completes (background notification), record its result:
- PR URL
- Files changed
- Test results
- Blockers encountered

Wait for ALL agents to complete before presenting the summary.

---

## Step 6 — Present results

Show a unified report:

```
## Parallel Run Complete

| Item | Status | PR | Files | Tests |
|------|--------|----|-------|-------|
| BL-044: Fix feedback error | PR created | #119 | 3 files | 2 added |
| BL-007: Set lang attribute | PR created | #120 | 2 files | 0 |

### Agent 1 — BL-044
- PR: https://github.com/YanCheng-go/danskprep/pull/119
- Changed: src/lib/supabase.ts, src/hooks/useFeedback.ts, src/test/feedback.test.ts
- Notes: <any concerns>

### Agent 2 — BL-007
- PR: https://github.com/YanCheng-go/danskprep/pull/120
- Changed: index.html, src/components/layout/Layout.tsx
- Notes: <any concerns>

### Next steps
Review each PR, then reply:
- "merge all" — merge all PRs sequentially
- "merge #119" — merge a specific PR
- "fix #120 <issue>" — request changes on a PR
```

---

## Step 7 — Merge (on user approval)

When the user approves merging:

### For "merge all"
Merge PRs sequentially (not in parallel — avoids merge conflicts on main):

For each PR:
1. `gh pr checks <number>` — verify CI passes
2. `git fetch origin main`
3. `gh pr merge <number> --squash --delete-branch`
4. Wait for merge to complete before starting the next one

After all merges:
1. Sync local: `git checkout main && git pull --rebase origin main`
2. Update project board for each closed item (Step 8.7 from `/commit`)
3. Clean up any remaining local branches

### For selective merge
Same process, but only for the specified PR(s).

---

## Step 8 — Post-merge

After all approved PRs are merged:

1. **Update backlog** — mark completed items as Done:
   ```bash
   # For each merged item
   gh issue close <number> --repo YanCheng-go/danskprep --reason completed
   # + set project Status to Done (see /commit Step 8.7)
   ```
2. **Report unblocked items** — check if any blocked items are now unblocked
3. **Suggest next actions**:
   - More parallel work? (`/parallel` again)
   - Release? (`/release`)
   - Retro? (`/retro`)

---

## Rules

- **Max 3 agents** — warn if user requests more, require explicit confirmation for 4+
- **Coordinator owns backlog** — agents never touch project board or issue statuses
- **No overlapping files** — block by default, require explicit override
- **Sequential merges** — never merge PRs in parallel to avoid conflicts on main
- **All PRs need approval** — never auto-merge, even if agents report clean
- **Agents are disposable** — if one fails, the others continue; report failures in summary
- **Always `gh auth switch --user YanCheng-go`** before any gh commands
- **Worktree cleanup** — the Agent tool handles this automatically; if an agent makes no changes, its worktree is removed
