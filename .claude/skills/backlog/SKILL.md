---
name: backlog
description: Manage the project backlog — add, list, filter, update, prioritize, and suggest work items
user-invocable: true
---

# /backlog — Project Backlog Manager (GitHub Projects)

## When to use

Use this skill to manage backlog items tracked in **GitHub Projects** (project #15). Items are GitHub Issues with custom fields (Priority, Effort, Scope) and labels (type, area). This replaces the old `docs/backlog.md` file-based approach.

**Project URL:** https://github.com/users/YanCheng-go/projects/15
**Repo:** `YanCheng-go/danskprep`

## Subcommand dispatch

Parse the user's arguments to determine which subcommand to run:

| Invocation | Action |
|---|---|
| `/backlog` (no args) | **Dashboard** — show status counts + top ready items |
| `/backlog add <text>` | **Add** — parse prompt, auto-assign metadata, confirm, create issue |
| `/backlog list [--status=X] [--area=X] [--priority=X]` | **List** — show filtered items |
| `/backlog view BL-NNN` | **View** — show full issue detail |
| `/backlog update BL-NNN field=value [...]` | **Update** — modify fields on issue/project |
| `/backlog done BL-NNN` | **Done** — close issue, set status to Done |
| `/backlog drop BL-NNN [reason]` | **Drop** — close issue as "not planned" |
| `/backlog next` | **Next** — recommend highest-priority unblocked item |
| `/backlog prioritize` | **Prioritize** — interactive review of open items |

---

## GitHub Projects structure

### Custom fields (SINGLE_SELECT on project)

| Field | Options |
|-------|---------|
| Priority | p0, p1, p2, p3 |
| Effort | xs, s, m, l, xl |
| Scope | all, PD3M2, PD3M1, PD2 |

### Labels (on repo)

| Prefix | Values |
|--------|--------|
| `type:` | `type:feature`, `type:bug`, `type:chore`, `type:infra`, `type:content` |
| `area:` | `area:ui`, `area:dx`, `area:db`, `area:quiz`, `area:auth`, `area:vocabulary`, `area:grammar`, `area:srs`, `area:scraping`, `area:analytics` |
| `status:` | `status:idea` (distinguishes ideas from ready items — both use Todo status) |

### Status mapping

| Backlog status | GitHub Projects Status | Issue state | Extra |
|----------------|----------------------|-------------|-------|
| idea | Todo | open | + `status:idea` label |
| ready | Todo | open | no `status:idea` label |
| in-progress | In Progress | open | — |
| done | Done | closed (completed) | — |
| dropped | Done | closed (not planned) | — |

### Field IDs (for `gh project item-edit`)

```
PROJECT_ID=PVT_kwHOAtALr84BQs_6
STATUS_FIELD=PVTSSF_lAHOAtALr84BQs_6zg-vxHc
  Todo=f75ad846  InProgress=47fc9ee4  Done=98236657
PRIORITY_FIELD=PVTSSF_lAHOAtALr84BQs_6zg-vxbg
  p0=794e355b  p1=151159eb  p2=5f1080aa  p3=99d30072
EFFORT_FIELD=PVTSSF_lAHOAtALr84BQs_6zg-vxcM
  xs=a24764ac  s=c6281781  m=0b736dda  l=639a71de  xl=c1b86069
SCOPE_FIELD=PVTSSF_lAHOAtALr84BQs_6zg-vxcQ
  all=458a4a3b  PD3M2=36696fe9  PD3M1=2e32e278  PD2=a544201a
```

### ID convention

Issue titles use the format `BL-NNN: <title>`. When creating a new issue, find the highest existing BL number:
```bash
gh issue list --repo YanCheng-go/danskprep --search "BL-" --json title --limit 200 | jq -r '.[].title' | grep -oP 'BL-\d+' | sort -t- -k2 -n | tail -1
```

---

## Subcommand instructions

### `/backlog` (dashboard)

1. Fetch all project items:
   ```bash
   gh project item-list 15 --owner YanCheng-go --format json --limit 200
   ```
2. Count items by Status field (Todo, In Progress, Done)
3. For Todo items, check for `status:idea` label to separate idea vs ready
4. List all In Progress items first
5. List top 5 ready items (Todo without `status:idea`) sorted by Priority (p0 first), then Effort (xs first)
6. Output as a formatted summary — **read-only, no modifications**

### `/backlog add <description>`

1. Find the next BL number (see ID convention above)
2. Apply **auto-assignment heuristics** (see below) to the user's description
3. **Dependency check** — before presenting, scan all open backlog items for relationships:
   - **Blocks**: Does this item need to be done before any existing item can start? (e.g., fixing a bug that a planned enhancement depends on)
   - **Blocked by**: Does an existing item need to finish first? (e.g., new item needs a migration that's already planned)
   - **Related**: Same area or overlapping scope, but no hard dependency (e.g., shared Supabase client config)
   - Include the dependency analysis in the confirmation prompt so the user can verify
4. Present the proposed item for confirmation:
   ```
   BL-038: Fix mobile quiz layout cutting off on iPhone SE
   Type: bug | Area: ui | Pri: p1 | Effort: s | Scope: all | Status: ready

   Description: [expanded from prompt]

   Dependencies:
   - Blocks: BL-024 (rate limiting) — depends on this working first
   - Blocked by: none
   - Related: BL-026 (mobile overflow) — same area

   Confirm? (or override any field)
   ```
4. On confirmation, create the issue and add to project:
   ```bash
   # Create issue
   gh issue create --repo YanCheng-go/danskprep \
     --title "BL-038: <title>" \
     --body "<description>" \
     --label "type:<type>,area:<area>"

   # Add to project
   gh project item-add 15 --owner YanCheng-go --url <issue_url> --format json

   # Set custom fields (use item ID from above)
   gh project item-edit --project-id PVT_kwHOAtALr84BQs_6 --id <item_id> \
     --field-id <FIELD_ID> --single-select-option-id <OPTION_ID>
   ```
   Repeat `item-edit` for Priority, Effort, and Scope fields.
5. If status is `idea`, also add the `status:idea` label

### `/backlog list [filters]`

1. Fetch project items:
   ```bash
   gh project item-list 15 --owner YanCheng-go --format json --limit 200
   ```
2. Apply filters:
   - `--status=X` → filter by Status field (idea/ready/in-progress/done/dropped)
   - `--area=X` → filter by `area:X` label
   - `--priority=X` → filter by Priority field
   - `--type=X` → filter by `type:X` label
   - No filters → show all items except Done status
3. Multiple filters combine with AND logic
4. Output as a table — **read-only, no modifications**

### `/backlog view BL-NNN`

1. Find the issue number:
   ```bash
   gh issue list --repo YanCheng-go/danskprep --search "BL-NNN" --json number,title --limit 5
   ```
2. View the full issue:
   ```bash
   gh issue view <number> --repo YanCheng-go/danskprep
   ```
3. Also show project field values (Priority, Effort, Scope, Status) from the project item data

### `/backlog update BL-NNN field=value [field=value ...]`

1. Find the issue and its project item ID
2. Validate field names and values against the schema
3. For each field update:
   - **Labels** (type, area): `gh issue edit <number> --add-label/--remove-label`
   - **Project fields** (priority, effort, scope, status): `gh project item-edit`
   - **Status changes**: Also update the issue state (open/closed) if moving to done/dropped
4. Add a comment on the issue noting the change:
   ```bash
   gh issue comment <number> --repo YanCheng-go/danskprep --body "Status changed from X to Y"
   ```

### `/backlog done BL-NNN`

1. Find the issue number from the BL-NNN title
2. Close the issue:
   ```bash
   gh issue close <number> --repo YanCheng-go/danskprep --reason completed
   ```
3. Set project Status to Done:
   ```bash
   gh project item-edit --project-id PVT_kwHOAtALr84BQs_6 --id <item_id> \
     --field-id PVTSSF_lAHOAtALr84BQs_6zg-vxHc --single-select-option-id 98236657
   ```
4. Add a comment: `Completed on YYYY-MM-DD`
5. Report if closing this issue unblocks others

### `/backlog drop BL-NNN [reason]`

1. Close the issue as "not planned":
   ```bash
   gh issue close <number> --repo YanCheng-go/danskprep --reason "not planned"
   ```
2. Set project Status to Done
3. Add a comment with the reason: `Dropped on YYYY-MM-DD — <reason>`
4. Warn if other items reference this one

### `/backlog next`

1. Fetch all open project items with Status=Todo (and no `status:idea` label)
2. Score each item:
   - Priority: p0=40, p1=30, p2=20, p3=10
   - Effort bonus (prefer quick wins): xs=10, s=8, m=5, l=2, xl=0
   - Context bonus: +5 if area matches files changed recently (`git diff --stat HEAD~5`)
3. Present the top recommendation with reasoning
4. Also list the next 2-3 alternatives

### `/backlog prioritize`

1. Fetch all open items, group by Priority
2. Ask the user which items should be promoted, demoted, or dropped
3. Apply changes as batch `gh project item-edit` calls
4. This is interactive — may take multiple turns

---

## Auto-assignment heuristics

When the user provides a natural language description, infer metadata using these rules. If multiple signals conflict, prefer the more specific one. Always present results for user confirmation.

### Type detection

| Signal words | Inferred type |
|---|---|
| fix, bug, broken, crash, error, wrong, stale | `bug` |
| add, new, implement, create, build, support | `feature` |
| exercise, word, grammar, sentence, prompt, content | `content` |
| migrate, deploy, CI, config, lint, test, build, Nix | `infra` |
| refactor, clean, rename, update deps, reorganize | `chore` |

### Area detection

| Signal words | Inferred area |
|---|---|
| quiz, exercise, cloze, multiple choice, word order | `quiz` |
| word, vocabulary, inflection, dictionary, verb, noun | `vocabulary` |
| grammar, topic, rule, conjugation, explanation | `grammar` |
| SRS, FSRS, card, review, spaced, scheduling | `srs` |
| layout, mobile, responsive, dark mode, button, page, CSS | `ui` |
| scrape, scraper, SpeakSpeak, speakandlearn, Moodle | `scraping` |
| Supabase, migration, database, RLS, table, SQL | `db` |
| auth, login, sign in, sign up, token, session | `auth` |
| progress, stats, chart, streak, analytics | `analytics` |
| CI, build, lint, Nix, deploy, Vercel, DX, tooling | `dx` |

### Priority detection

| Signal words | Inferred priority |
|---|---|
| critical, urgent, blocks everything, security, ASAP | `p0` |
| important, should, next, soon, high priority | `p1` |
| _(no signal — default)_ | `p2` |
| nice to have, someday, low, minor, eventually | `p3` |

### Effort detection

| Signal words | Inferred effort |
|---|---|
| quick, one-liner, trivial, just change, tiny | `xs` |
| small, simple, straightforward | `s` |
| _(no signal — default)_ | `m` |
| complex, multiple files, needs research, several | `l` |
| epic, multi-session, whole system, major rewrite | `xl` |

### Exam scope detection

| Signal | Inferred scope |
|---|---|
| Mentions PD2 or Module 2 content specifically | `PD2` |
| Mentions PD3M1 or Module 3.1 content | `PD3M1` |
| Mentions PD3M2 or Module 3.2 content | `PD3M2` |
| Infrastructure, UI, or cross-cutting concern | `all` |
| Not exam-related at all | (leave blank) |

### Default status

New items start as `ready` (Todo, no `status:idea` label) unless the user says "just an idea", "maybe", "someday", or "thinking about" — then use `idea` (Todo + `status:idea` label).

---

## Integration with other skills

- After completing work on a backlog item, run `/backlog done BL-NNN` before creating a PR
- The `/commit` skill searches GitHub Issues for related backlog items
- PRs should use `Closes #NNN` format to auto-close issues on merge

## Rules

- Always use today's date for timestamps in comments
- Never modify issues on read-only operations (dashboard, list, view, next)
- Always confirm with the user before creating new issues or making bulk changes
- IDs are permanent — never reuse a dropped/done item's BL number
- Always run `gh auth switch --user YanCheng-go` before any gh commands
