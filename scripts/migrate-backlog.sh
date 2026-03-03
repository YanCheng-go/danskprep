#!/usr/bin/env bash
# migrate-backlog.sh — One-time migration of docs/backlog.md items to GitHub Projects
#
# Usage: bash scripts/migrate-backlog.sh [--dry-run]
#
# Creates GitHub Issues for each backlog item, adds them to Project #15,
# and sets custom fields (Priority, Effort, Scope, Status).

set -euo pipefail

OWNER="YanCheng-go"
REPO="YanCheng-go/danskprep"
PROJECT_NUM=15

# Field IDs (from `gh project field-list 15 --owner YanCheng-go`)
STATUS_FIELD="PVTSSF_lAHOAtALr84BQs_6zg-vxHc"
PRIORITY_FIELD="PVTSSF_lAHOAtALr84BQs_6zg-vxbg"
EFFORT_FIELD="PVTSSF_lAHOAtALr84BQs_6zg-vxcM"
SCOPE_FIELD="PVTSSF_lAHOAtALr84BQs_6zg-vxcQ"

# Status option IDs
declare -A STATUS_OPTIONS=(
  [todo]="f75ad846"
  [in_progress]="47fc9ee4"
  [done]="98236657"
)

# Priority option IDs
declare -A PRIORITY_OPTIONS=(
  [p0]="794e355b"
  [p1]="151159eb"
  [p2]="5f1080aa"
  [p3]="99d30072"
)

# Effort option IDs
declare -A EFFORT_OPTIONS=(
  [xs]="a24764ac"
  [s]="c6281781"
  [m]="0b736dda"
  [l]="639a71de"
  [xl]="c1b86069"
)

# Scope option IDs
declare -A SCOPE_OPTIONS=(
  [all]="458a4a3b"
  [PD3M2]="36696fe9"
  [PD3M1]="2e32e278"
  [PD2]="a544201a"
)

DRY_RUN=false
if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=true
  echo "=== DRY RUN — no changes will be made ==="
fi

CREATED=0
FAILED=0

# create_issue ID TITLE TYPE AREA PRIORITY EFFORT STATUS SCOPE BODY
create_issue() {
  local id="$1" title="$2" type="$3" area="$4" pri="$5" effort="$6" status="$7" scope="$8" body="$9"

  local labels="type:${type},area:${area}"
  if [[ "$status" == "idea" ]]; then
    labels="${labels},status:idea"
  fi

  local full_title="${id}: ${title}"

  echo ""
  echo "--- ${full_title} [${status}] ---"

  if $DRY_RUN; then
    echo "  Would create issue: ${full_title}"
    echo "  Labels: ${labels}"
    echo "  Priority: ${pri}, Effort: ${effort}, Scope: ${scope}, Status: ${status}"
    CREATED=$((CREATED + 1))
    return 0
  fi

  # 1. Create the issue
  local issue_url
  issue_url=$(gh issue create \
    --repo "$REPO" \
    --title "$full_title" \
    --body "$body" \
    --label "$labels" \
    2>&1) || {
    echo "  FAILED to create issue: ${issue_url}"
    FAILED=$((FAILED + 1))
    return 1
  }
  echo "  Created: ${issue_url}"

  # Extract issue number from URL
  local issue_num
  issue_num=$(echo "$issue_url" | grep -oE '[0-9]+$')

  # 2. Add to project
  local item_id
  item_id=$(gh project item-add "$PROJECT_NUM" \
    --owner "$OWNER" \
    --url "$issue_url" \
    --format json 2>&1 | jq -r '.id') || {
    echo "  FAILED to add to project"
    FAILED=$((FAILED + 1))
    return 1
  }
  echo "  Added to project (item: ${item_id})"

  # 3. Set Status
  local status_option
  case "$status" in
    idea|ready)  status_option="${STATUS_OPTIONS[todo]}" ;;
    in-progress) status_option="${STATUS_OPTIONS[in_progress]}" ;;
    done|dropped) status_option="${STATUS_OPTIONS[done]}" ;;
  esac

  gh project item-edit \
    --project-id "PVT_kwHOAtALr84BQs_6" \
    --id "$item_id" \
    --field-id "$STATUS_FIELD" \
    --single-select-option-id "$status_option" 2>/dev/null || echo "  Warning: failed to set Status"

  # 4. Set Priority
  local pri_option="${PRIORITY_OPTIONS[$pri]}"
  gh project item-edit \
    --project-id "PVT_kwHOAtALr84BQs_6" \
    --id "$item_id" \
    --field-id "$PRIORITY_FIELD" \
    --single-select-option-id "$pri_option" 2>/dev/null || echo "  Warning: failed to set Priority"

  # 5. Set Effort
  local eff_option="${EFFORT_OPTIONS[$effort]}"
  gh project item-edit \
    --project-id "PVT_kwHOAtALr84BQs_6" \
    --id "$item_id" \
    --field-id "$EFFORT_FIELD" \
    --single-select-option-id "$eff_option" 2>/dev/null || echo "  Warning: failed to set Effort"

  # 6. Set Scope (skip if "—")
  if [[ "$scope" != "—" && -n "${SCOPE_OPTIONS[$scope]:-}" ]]; then
    gh project item-edit \
      --project-id "PVT_kwHOAtALr84BQs_6" \
      --id "$item_id" \
      --field-id "$SCOPE_FIELD" \
      --single-select-option-id "${SCOPE_OPTIONS[$scope]}" 2>/dev/null || echo "  Warning: failed to set Scope"
  fi

  # 7. Close issue if done/dropped
  if [[ "$status" == "done" ]]; then
    gh issue close "$issue_num" --repo "$REPO" --reason completed 2>/dev/null || echo "  Warning: failed to close issue"
    echo "  Closed (completed)"
  elif [[ "$status" == "dropped" ]]; then
    gh issue close "$issue_num" --repo "$REPO" --reason "not planned" 2>/dev/null || echo "  Warning: failed to close issue"
    echo "  Closed (not planned)"
  fi

  CREATED=$((CREATED + 1))
  # Rate limit: small delay between issues
  sleep 1
}

echo "=== Migrating DanskPrep Backlog to GitHub Projects ==="
echo "Project: ${OWNER}/projects/${PROJECT_NUM}"
echo ""

# ── BL-001 ──
create_issue "BL-001" "Cloud storage for speaking recordings" "feature" "ui" "p2" "l" "idea" "all" \
"Audio recordings on /speaking are currently only held in-memory (blob URLs) and lost on page leave. Add cloud storage (Supabase Storage or similar) so users can save, replay, and track their speaking practice over time."

# ── BL-002 ──
create_issue "BL-002" "LLM-based seed data validation script" "infra" "dx" "p2" "m" "ready" "PD3M2" \
"Build a Python script (\`scripts/validate-seed-data.py\`) that uses Claude to scan all seed JSON files and flag data quality issues proactively.

**What it validates:**
- Null/empty fields where values are expected
- Schema consistency across entries
- Danish text quality — grammar errors, missing articles, wrong inflection patterns
- Exercise quality — cloze with ambiguous blanks, MC with <4 options
- Duplicate detection — similar exercises or words that may be redundant
- Missing cross-references — exercises referencing grammar topics that don't exist

**Acceptance criteria:**
- Script runs via \`cd scripts && uv run python validate-seed-data.py\`
- Catches the known issue: 143 verbs with empty inflections
- Zero false positives on current clean data
- Report format: JSON or markdown, machine-readable for CI integration"

# ── BL-003 ──
create_issue "BL-003" "Add post length customization to /some skill" "chore" "dx" "p3" "xs" "ready" "—" \
"The \`/some\` skill currently generates posts at a fixed length per platform. Add a \`--length\` flag (short/medium/long) so users can control verbosity. Short = hook + 2-3 lines + CTA. Medium = current default. Long = full story with background and details."

# ── BL-004 ──
create_issue "BL-004" "Add skip-to-content link" "chore" "ui" "p1" "xs" "ready" "all" \
"Screen reader users and keyboard navigators must tab through the header and sidebar (15+ links) before reaching main content. Add \`<a href=\"#main\" class=\"sr-only focus:not-sr-only ...\">\` and \`<main id=\"main\">\` around \`<Outlet />\`.

**Files:** \`src/components/layout/Layout.tsx\`, \`src/App.tsx\`"

# ── BL-005 ──
create_issue "BL-005" "Add Content Security Policy headers" "infra" "dx" "p2" "s" "ready" "all" \
"Neither \`vercel.json\` nor \`index.html\` sets CSP headers. Without CSP, injected scripts can exfiltrate localStorage keys. Add CSP headers in \`vercel.json\`: \`default-src 'self'; script-src 'self'; connect-src 'self' https://*.supabase.co https://api.anthropic.com https://openrouter.ai https://api.openai.com\`.

**Files:** \`vercel.json\`, \`index.html\`"

# ── BL-006 ──
create_issue "BL-006" "Fix hardcoded English strings in i18n" "bug" "ui" "p2" "s" "ready" "all" \
"Several components have hardcoded English strings instead of using \`t()\`: \`FlashCard.tsx:79\` (\"Check\"), \`FlashCard.tsx:92\` (\"Show answer\"), \`FlashCard.tsx:100-102\` (\"Correct!\", \"Almost\", \"You wrote:\"), \`DanishInput.tsx:23\` (placeholder), \`QuizPage.tsx:30-37\` (grammar topic labels).

**Files:** \`src/components/study/FlashCard.tsx\`, \`src/components/ui/DanishInput.tsx\`, \`src/pages/QuizPage.tsx\`"

# ── BL-007 ──
create_issue "BL-007" "Set html lang attribute from locale" "bug" "ui" "p3" "xs" "ready" "all" \
"\`<html lang=\"da\">\` is hardcoded in \`index.html\` regardless of user's selected locale. When user switches to English, screen readers still announce content as Danish. Set \`document.documentElement.lang\` in the \`I18nProvider\` when locale changes.

**Files:** \`index.html\`, \`src/lib/i18n.tsx\`"

# ── BL-008 ──
create_issue "BL-008" "Fix WelcomePage agentation prod import" "bug" "ui" "p2" "xs" "ready" "all" \
"\`WelcomePage.tsx\` imports \`Agentation\` unconditionally. While Layout uses \`{import.meta.env.DEV && <Agentation />}\`, WelcomePage also renders it. The import may not be tree-shaken if the component has side effects.

**Fix:** Use \`React.lazy()\` + \`Suspense\` for the Agentation import.

**Files:** \`src/pages/WelcomePage.tsx\`"

# ── BL-009 ──
create_issue "BL-009" "Move AI calls to serverless proxy" "feature" "auth" "p1" "l" "ready" "all" \
"API keys stored in localStorage are exposed to XSS. Direct browser-to-AI-API calls with \`anthropic-dangerous-direct-browser-access\` header expose user keys in network tab. Move AI calls behind a Vercel serverless function, store keys server-side.

**Files:** \`src/lib/ai-provider.ts\`, \`src/lib/constants.ts\`, \`api/\`"

# ── BL-010 ──
create_issue "BL-010" "Lazy-load seed JSON for performance" "chore" "ui" "p1" "m" "ready" "all" \
"\`exercises-pd3m2.json\` (136KB) and \`words-pd3m2.json\` (100KB) are eagerly imported in \`useStudy.ts\` and \`useWords.ts\`, inflating chunks by ~264KB. On mobile 3G, adds ~2-3 seconds to TTI. Use dynamic \`import()\` with a loading state.

**Files:** \`src/hooks/useStudy.ts\`, \`src/hooks/useWords.ts\`"

# ── BL-011 ──
create_issue "BL-011" "Split useStudy hook into smaller hooks" "chore" "dx" "p2" "m" "ready" "all" \
"\`useStudy\` is ~490 lines handling queue loading, card initialization, top-up, variant building, and review scheduling. Split into \`useStudyQueue\` (data loading) and \`useStudyReview\` (FSRS scheduling), extract \`buildWordVariants\` to a pure utility.

**Files:** \`src/hooks/useStudy.ts\`"

# ── BL-012 ──
create_issue "BL-012" "Extract shared shuffle utility" "chore" "dx" "p2" "xs" "ready" "all" \
"Fisher-Yates shuffle is implemented 3 times: \`drill-engine.ts\`, \`MultipleChoice.tsx\`, and via biased \`Math.random() - 0.5\` in \`QuizPage.tsx\`. Extract to \`src/lib/utils.ts\`, replace all usages.

**Files:** \`src/lib/drill-engine.ts\`, \`src/components/quiz/MultipleChoice.tsx\`, \`src/pages/QuizPage.tsx\`, \`src/lib/utils.ts\`"

# ── BL-013 ──
create_issue "BL-013" "Add ARIA roles to quiz mode toggle" "chore" "ui" "p2" "xs" "ready" "all" \
"Quiz/list toggle (\`QuizPage.tsx:75-95\`) uses plain \`<button>\` without \`role=\"tablist\"\` / \`role=\"tab\"\` / \`aria-selected\`. Add proper ARIA roles for screen reader support.

**Files:** \`src/pages/QuizPage.tsx\`"

# ── BL-014 ──
create_issue "BL-014" "Add label + DanishInput to FlashCard" "chore" "ui" "p2" "s" "ready" "all" \
"FlashCard answer input uses placeholder but no \`<label>\` or \`aria-label\`. Screen readers announce it as generic text input. Also missing Danish keyboard buttons (æ, ø, å). Add \`aria-label\` and consider using \`DanishInput\` component.

**Files:** \`src/components/study/FlashCard.tsx\`"

# ── BL-015 ──
create_issue "BL-015" "Add focus management on route change" "chore" "ui" "p2" "s" "ready" "all" \
"When navigating between pages, focus stays on the clicked link. Screen reader users lose context. Add a \`useEffect\` in Layout that focuses the main content on route change, or use \`react-router\`'s \`ScrollRestoration\` with focus management.

**Files:** \`src/components/layout/Layout.tsx\`"

# ── BL-016 ──
create_issue "BL-016" "Fix allExercises stale data in QuizPage" "bug" "quiz" "p2" "xs" "ready" "all" \
"\`loadUserExercises()\` is called at module evaluation time (\`QuizPage.tsx:25-28\`), meaning it runs once at import and never refreshes when user adds exercises during the session. Move into a \`useMemo\` or state initializer that refreshes.

**Files:** \`src/pages/QuizPage.tsx\`"

# ── BL-017 ──
create_issue "BL-017" "Stabilize seed data IDs" "chore" "db" "p2" "l" "idea" "all" \
"\`content_id\` in \`user_cards\` stores \`local-exercise-0\` etc. — indices into client-side arrays. If seed data order changes, all user_cards become misaligned. Add stable UUIDs to seed JSON files and use as content_id.

**Files:** \`supabase/migrations/001_initial_schema.sql\`, \`src/data/seed/*.json\`"

# ── BL-018 ──
create_issue "BL-018" "Add updated_at DB trigger" "chore" "db" "p2" "xs" "idea" "all" \
"The \`updated_at\` column on \`user_cards\` is only set via client-side code. A DB trigger would be more reliable and resistant to clock skew. Add a \`moddatetime\` trigger or simple \`BEFORE UPDATE\` trigger.

**Files:** \`supabase/migrations/\`"

# ── BL-019 ──
create_issue "BL-019" "Respect prefers-reduced-motion" "chore" "ui" "p3" "xs" "idea" "all" \
"Bubble animations, accordion animations, and scroll-bounce run regardless of user motion preferences. Add \`@media (prefers-reduced-motion: reduce)\` rules.

**Files:** \`src/index.css\`, animation components"

# ── BL-020 ──
create_issue "BL-020" "Mobile virtual keyboard handling" "feature" "ui" "p2" "s" "idea" "all" \
"When mobile keyboard appears on quiz/drill pages, it pushes content up. \"Check Answer\" button may be hidden. Use \`scrollIntoView({ behavior: 'smooth' })\` on input focus or make submit button sticky at bottom.

**Files:** Quiz and drill page components"

# ── BL-021 ──
create_issue "BL-021" "Evaluate React Router v7 upgrade" "chore" "dx" "p3" "m" "idea" "all" \
"React Router v7 offers file-based routing, improved data loading, Remix-like API. Current v6.28 still maintained but will reach EOL. Evaluate when ready to adopt loader/action patterns."

# ── BL-022 ──
create_issue "BL-022" "Evaluate Tailwind v4 upgrade" "chore" "dx" "p3" "m" "idea" "all" \
"Tailwind v4 is production-ready with CSS-only config and perf improvements. shadcn/ui now supports v4. Project chose v3 for compatibility — re-evaluate."

# ── BL-023 ──
create_issue "BL-023" "Expand test coverage for hooks" "chore" "dx" "p3" "l" "idea" "all" \
"Only \`answer-check.test.ts\`, \`drill-engine.test.ts\`, \`DictionaryPage.test.tsx\`, and \`BubbleLeaderboard.test.tsx\` exist. No tests for hooks (\`useStudy\`, \`useQuiz\`, \`useDrill\`), FSRS logic, or i18n. Add hook tests with \`@testing-library/react\` \`renderHook\`."

# ── BL-024 ──
create_issue "BL-024" "Add rate limiting on feedback inserts" "infra" "db" "p2" "s" "ready" "all" \
"Feedback table allows unauthenticated inserts with \`check (true)\` — any anonymous user can spam rows. Add a rate-limit function or restrict to authenticated users only.

**Files:** \`supabase/migrations/003_add_feedback.sql\`"

# ── BL-025 ──
create_issue "BL-025" "Add safe area insets for notched devices" "chore" "ui" "p3" "xs" "idea" "all" \
"App doesn't use \`env(safe-area-inset-*)\` for bottom navigation or sticky headers on devices with notches/home indicators. Add \`padding-bottom: env(safe-area-inset-bottom)\` to fixed/sticky elements.

**Files:** \`src/index.css\`, Layout components"

# ── BL-026 ──
create_issue "BL-026" "Fix mobile horizontal overflow in Layout" "bug" "ui" "p0" "s" "done" "all" \
"All Layout-wrapped pages horizontally scroll ~74px beyond the 375px viewport (scrollWidth=449). Two root causes:

1. **Header toolbar** — the row of action buttons overflows without wrapping at small widths.
2. **GamePanel aside** — when closed, \`translate-x-full\` on a \`fixed inset-0\` element contributes to scrollable width.

**Fixed in PR #35.** Closed 2026-03-03."

# ── BL-027 ──
create_issue "BL-027" "Add aria-labels to all icon buttons" "bug" "ui" "p0" "xs" "done" "all" \
"8 button elements on every page lack accessible names. Screen readers cannot announce what they do. Buttons are in the header toolbar using only SVG icons without \`aria-label\`. WCAG 2.0 Level A violation (\`button-name\` rule).

**Fixed in PR #35.** Closed 2026-03-03."

# ── BL-028 ──
create_issue "BL-028" "Fix color contrast to meet WCAG AA" "bug" "ui" "p1" "m" "ready" "all" \
"Foreground/background color combinations fail WCAG AA minimum (4.5:1 for text, 3:1 for large text). Worst pages: \`/vocabulary\` (37 instances), \`/welcome\` (23), \`/updates\` (15). Likely from muted text colors and POS tags. ~130+ total instances.

**Fix:** Audit muted text colors. Use \`text-muted-foreground\` values that meet 4.5:1 ratio."

# ── BL-029 ──
create_issue "BL-029" "Add labels to header/dictionary search inputs" "bug" "ui" "p1" "xs" "ready" "all" \
"2 form input elements on every page lack associated \`<label>\` or \`aria-label\`. The header search input and dictionary search input. WCAG 2.0 Level A violation (\`label\` rule), ~26 instances total.

**Files:** \`src/components/layout/Header.tsx\`, \`src/pages/DictionaryPage.tsx\`"

# ── BL-030 ──
create_issue "BL-030" "Fix nested interactive control in header" "bug" "ui" "p2" "xs" "ready" "all" \
"Header search bar is wrapped inside a \`<button>\` or clickable parent, creating a nested interactive control. Screen readers and keyboard navigation behave unpredictably with nested focusable elements.

**Files:** \`src/components/layout/Header.tsx\`"

# ── BL-031 ──
create_issue "BL-031" "Fix duplicate search inputs on dict mobile" "bug" "ui" "p2" "xs" "dropped" "all" \
"~~On mobile, the dictionary page shows both the header search icon and the page-level search input, creating duplicate search entry points.~~

**Dropped:** Subsumed by BL-033 (mobile header redesign), which moves all utility icons including search into the sidebar on mobile."

# ── BL-032 ──
create_issue "BL-032" "Integrate local Danish LLM for app features" "feature" "vocabulary" "p1" "xl" "ready" "all" \
"Integrate a local Danish-optimized LLM (e.g., Munin models from ScandEval) for vocabulary enrichment, exercise generation, and answer checking without requiring cloud API keys.

See \`.claude/references/danish-llm-models.md\` for research notes."

# ── BL-033 ──
create_issue "BL-033" "Redesign mobile header — move icons to sidebar" "feature" "ui" "p1" "m" "ready" "all" \
"Three mobile header issues combined into one redesign:

1. **Duplicate dictionary search** — header search icon + page search input both visible on mobile
2. **Hidden header icons** — game controls and utility buttons overflow on narrow screens
3. **Sidebar-header gap** — 1px visual gap between header and mobile sidebar drawer

**Solution:** Move all utility icons (search, dark mode, language, game, support, sign in/out) into a \"Quick Actions\" section in the sidebar, visible only on mobile.

**Subsumes:** BL-031 (duplicate search inputs)

See implementation plan at \`docs/plans/mobile-header-redesign.md\`."

# ── BL-034 ──
create_issue "BL-034" "Evaluate backlog file vs GitHub Projects" "chore" "dx" "p3" "s" "done" "all" \
"Investigate whether the current \`docs/backlog.md\` file-based approach or GitHub Projects is better for project planning and tracking. Compare on discoverability, AI-agent compatibility, filtering, offline access, version control, overhead, and automation.

**Decision: Migrate to GitHub Projects.** This migration is the result of this evaluation."

# ── BL-035 ──
create_issue "BL-035" "Allow setting max quiz questions per session" "feature" "quiz" "p0" "s" "ready" "all" \
"The quiz session length is currently hardcoded. Add a user-configurable setting to control the maximum number of questions per quiz session (e.g., 10, 20, 30, or unlimited). Persist the preference in localStorage so it survives page refreshes. Show the control on the quiz page before starting a session.

**Files:** \`src/pages/QuizPage.tsx\`, \`src/hooks/useQuiz.ts\`"

# ── BL-036 ──
create_issue "BL-036" "Remove default AI provider settings" "bug" "ui" "p0" "xs" "ready" "all" \
"The AI provider settings page pre-fills default values in the input fields. Remove the default values so inputs start empty, but keep placeholder text showing the expected format (e.g., \`sk-ant-...\` for API key, \`https://api.anthropic.com\` for URL).

**Files:** \`src/lib/ai-provider.ts\`, AI settings component(s)"

# ── BL-037 ──
create_issue "BL-037" "Change search placeholder to Type a Danish word" "chore" "ui" "p2" "xs" "ready" "all" \
"Update the dictionary/search input placeholder text from the current generic text to \"Type a Danish word\". Update both English and Danish translation strings in the i18n files.

**Files:** \`src/pages/DictionaryPage.tsx\` (or Header search), i18n translation files"

echo ""
echo "=== Migration complete ==="
echo "Created: ${CREATED}"
echo "Failed: ${FAILED}"
echo "Project URL: https://github.com/users/YanCheng-go/projects/15"
