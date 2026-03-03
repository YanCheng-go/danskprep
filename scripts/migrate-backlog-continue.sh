#!/usr/bin/env bash
# migrate-backlog-continue.sh — Continue migration from BL-024 onwards + fix BL-023
set -euo pipefail

OWNER="YanCheng-go"
REPO="YanCheng-go/danskprep"
PROJECT_ID="PVT_kwHOAtALr84BQs_6"

STATUS_FIELD="PVTSSF_lAHOAtALr84BQs_6zg-vxHc"
PRIORITY_FIELD="PVTSSF_lAHOAtALr84BQs_6zg-vxbg"
EFFORT_FIELD="PVTSSF_lAHOAtALr84BQs_6zg-vxcM"
SCOPE_FIELD="PVTSSF_lAHOAtALr84BQs_6zg-vxcQ"

declare -A STATUS_OPTIONS=([todo]="f75ad846" [in_progress]="47fc9ee4" [done]="98236657")
declare -A PRIORITY_OPTIONS=([p0]="794e355b" [p1]="151159eb" [p2]="5f1080aa" [p3]="99d30072")
declare -A EFFORT_OPTIONS=([xs]="a24764ac" [s]="c6281781" [m]="0b736dda" [l]="639a71de" [xl]="c1b86069")
declare -A SCOPE_OPTIONS=([all]="458a4a3b" [PD3M2]="36696fe9" [PD3M1]="2e32e278" [PD2]="a544201a")

CREATED=0
FAILED=0

set_fields() {
  local item_id="$1" pri="$2" effort="$3" scope="$4" status_key="$5"

  # Status
  local status_opt
  case "$status_key" in
    idea|ready)  status_opt="${STATUS_OPTIONS[todo]}" ;;
    in-progress) status_opt="${STATUS_OPTIONS[in_progress]}" ;;
    done|dropped) status_opt="${STATUS_OPTIONS[done]}" ;;
  esac
  gh project item-edit --project-id "$PROJECT_ID" --id "$item_id" \
    --field-id "$STATUS_FIELD" --single-select-option-id "$status_opt" 2>/dev/null || echo "  Warning: Status"

  # Priority
  gh project item-edit --project-id "$PROJECT_ID" --id "$item_id" \
    --field-id "$PRIORITY_FIELD" --single-select-option-id "${PRIORITY_OPTIONS[$pri]}" 2>/dev/null || echo "  Warning: Priority"

  # Effort
  gh project item-edit --project-id "$PROJECT_ID" --id "$item_id" \
    --field-id "$EFFORT_FIELD" --single-select-option-id "${EFFORT_OPTIONS[$effort]}" 2>/dev/null || echo "  Warning: Effort"

  # Scope
  if [[ "$scope" != "—" && -n "${SCOPE_OPTIONS[$scope]:-}" ]]; then
    gh project item-edit --project-id "$PROJECT_ID" --id "$item_id" \
      --field-id "$SCOPE_FIELD" --single-select-option-id "${SCOPE_OPTIONS[$scope]}" 2>/dev/null || echo "  Warning: Scope"
  fi
}

add_to_project_and_set() {
  local issue_url="$1" pri="$2" effort="$3" scope="$4" status="$5" issue_num="$6"

  # Add to project — handle non-JSON output gracefully
  local raw_output
  raw_output=$(gh project item-add 15 --owner "$OWNER" --url "$issue_url" --format json 2>&1) || {
    echo "  FAILED to add to project: $raw_output"
    FAILED=$((FAILED + 1))
    return 1
  }

  local item_id
  item_id=$(echo "$raw_output" | jq -r '.id' 2>/dev/null) || {
    echo "  FAILED to parse item ID from: $raw_output"
    FAILED=$((FAILED + 1))
    return 1
  }
  echo "  Added to project (item: ${item_id})"

  set_fields "$item_id" "$pri" "$effort" "$scope" "$status"

  # Close if done/dropped
  if [[ "$status" == "done" ]]; then
    gh issue close "$issue_num" --repo "$REPO" --reason completed 2>/dev/null || true
    echo "  Closed (completed)"
  elif [[ "$status" == "dropped" ]]; then
    gh issue close "$issue_num" --repo "$REPO" --reason "not planned" 2>/dev/null || true
    echo "  Closed (not planned)"
  fi

  CREATED=$((CREATED + 1))
  sleep 1
}

create_and_add() {
  local title="$1" body="$2" labels="$3" pri="$4" effort="$5" status="$6" scope="$7"

  echo ""
  echo "--- ${title} [${status}] ---"

  local issue_url
  issue_url=$(gh issue create --repo "$REPO" --title "$title" --body "$body" --label "$labels" 2>&1) || {
    echo "  FAILED to create issue: $issue_url"
    FAILED=$((FAILED + 1))
    return 1
  }
  echo "  Created: $issue_url"
  local issue_num
  issue_num=$(echo "$issue_url" | grep -oE '[0-9]+$')

  add_to_project_and_set "$issue_url" "$pri" "$effort" "$scope" "$status" "$issue_num"
}

echo "=== Continuing migration ==="

# ── Fix BL-023 (issue #63) — missing Effort and Scope ──
echo ""
echo "--- Fixing BL-023 (issue #63) — setting Effort=l, Scope=all ---"
# Get the project item ID for issue #63
ITEM_023=$(gh project item-list 15 --owner "$OWNER" --format json --limit 200 | jq -r '.items[] | select(.content.number == 63) | .id')
if [[ -n "$ITEM_023" ]]; then
  set_fields "$ITEM_023" "p3" "l" "all" "idea"
  echo "  Fixed BL-023 fields"
else
  echo "  Warning: Could not find project item for issue #63"
fi

# ── Fix BL-024 (issue #64) — failed to add to project ──
echo ""
echo "--- Fixing BL-024 (issue #64) — adding to project ---"
add_to_project_and_set "https://github.com/YanCheng-go/danskprep/issues/64" "p2" "s" "all" "ready" "64"

# ── BL-025 through BL-037 ──

create_and_add "BL-025: Add safe area insets for notched devices" \
"App doesn't use \`env(safe-area-inset-*)\` for bottom navigation or sticky headers on devices with notches/home indicators. Add \`padding-bottom: env(safe-area-inset-bottom)\` to fixed/sticky elements.

**Files:** \`src/index.css\`, Layout components" \
"type:chore,area:ui,status:idea" "p3" "xs" "idea" "all"

create_and_add "BL-026: Fix mobile horizontal overflow in Layout" \
"All Layout-wrapped pages horizontally scroll ~74px beyond the 375px viewport (scrollWidth=449). Two root causes:

1. **Header toolbar** — the row of action buttons overflows without wrapping at small widths.
2. **GamePanel aside** — when closed, \`translate-x-full\` on a \`fixed inset-0\` element contributes to scrollable width.

**Fixed in PR #35.** Closed 2026-03-03." \
"type:bug,area:ui" "p0" "s" "done" "all"

create_and_add "BL-027: Add aria-labels to all icon buttons" \
"8 button elements on every page lack accessible names. Screen readers cannot announce what they do. Buttons are in the header toolbar using only SVG icons without \`aria-label\`. WCAG 2.0 Level A violation (\`button-name\` rule).

**Fixed in PR #35.** Closed 2026-03-03." \
"type:bug,area:ui" "p0" "xs" "done" "all"

create_and_add "BL-028: Fix color contrast to meet WCAG AA" \
"Foreground/background color combinations fail WCAG AA minimum (4.5:1 for text, 3:1 for large text). Worst pages: \`/vocabulary\` (37 instances), \`/welcome\` (23), \`/updates\` (15). Likely from muted text colors and POS tags. ~130+ total instances.

**Fix:** Audit muted text colors. Use \`text-muted-foreground\` values that meet 4.5:1 ratio." \
"type:bug,area:ui" "p1" "m" "ready" "all"

create_and_add "BL-029: Add labels to header/dictionary search inputs" \
"2 form input elements on every page lack associated \`<label>\` or \`aria-label\`. The header search input and dictionary search input. WCAG 2.0 Level A violation (\`label\` rule), ~26 instances total.

**Files:** \`src/components/layout/Header.tsx\`, \`src/pages/DictionaryPage.tsx\`" \
"type:bug,area:ui" "p1" "xs" "ready" "all"

create_and_add "BL-030: Fix nested interactive control in header" \
"Header search bar is wrapped inside a \`<button>\` or clickable parent, creating a nested interactive control. Screen readers and keyboard navigation behave unpredictably with nested focusable elements.

**Files:** \`src/components/layout/Header.tsx\`" \
"type:bug,area:ui" "p2" "xs" "ready" "all"

create_and_add "BL-031: Fix duplicate search inputs on dict mobile" \
"~~On mobile, the dictionary page shows both the header search icon and the page-level search input, creating duplicate search entry points.~~

**Dropped:** Subsumed by BL-033 (mobile header redesign), which moves all utility icons including search into the sidebar on mobile." \
"type:bug,area:ui" "p2" "xs" "dropped" "all"

create_and_add "BL-032: Integrate local Danish LLM for app features" \
"Integrate a local Danish-optimized LLM (e.g., Munin models from ScandEval) for vocabulary enrichment, exercise generation, and answer checking without requiring cloud API keys.

See \`.claude/references/danish-llm-models.md\` for research notes." \
"type:feature,area:vocabulary" "p1" "xl" "ready" "all"

create_and_add "BL-033: Redesign mobile header — move icons to sidebar" \
"Three mobile header issues combined into one redesign:

1. **Duplicate dictionary search** — header search icon + page search input both visible on mobile
2. **Hidden header icons** — game controls and utility buttons overflow on narrow screens
3. **Sidebar-header gap** — 1px visual gap between header and mobile sidebar drawer

**Solution:** Move all utility icons (search, dark mode, language, game, support, sign in/out) into a \"Quick Actions\" section in the sidebar, visible only on mobile.

**Subsumes:** BL-031 (duplicate search inputs)

See implementation plan at \`docs/plans/mobile-header-redesign.md\`." \
"type:feature,area:ui" "p1" "m" "ready" "all"

create_and_add "BL-034: Evaluate backlog file vs GitHub Projects" \
"Investigate whether the current \`docs/backlog.md\` file-based approach or GitHub Projects is better for project planning and tracking.

**Decision: Migrate to GitHub Projects.** This migration is the result of this evaluation." \
"type:chore,area:dx" "p3" "s" "done" "all"

create_and_add "BL-035: Allow setting max quiz questions per session" \
"The quiz session length is currently hardcoded. Add a user-configurable setting to control the maximum number of questions per quiz session (e.g., 10, 20, 30, or unlimited). Persist the preference in localStorage so it survives page refreshes.

**Files:** \`src/pages/QuizPage.tsx\`, \`src/hooks/useQuiz.ts\`" \
"type:feature,area:quiz" "p0" "s" "ready" "all"

create_and_add "BL-036: Remove default AI provider settings" \
"The AI provider settings page pre-fills default values in the input fields. Remove the default values so inputs start empty, but keep placeholder text showing the expected format.

**Files:** \`src/lib/ai-provider.ts\`, AI settings component(s)" \
"type:bug,area:ui" "p0" "xs" "ready" "all"

create_and_add "BL-037: Change search placeholder to Type a Danish word" \
"Update the dictionary/search input placeholder text from the current generic text to \"Type a Danish word\". Update both English and Danish translation strings in the i18n files.

**Files:** \`src/pages/DictionaryPage.tsx\` (or Header search), i18n translation files" \
"type:chore,area:ui" "p2" "xs" "ready" "all"

echo ""
echo "=== Continuation complete ==="
echo "Created/Fixed: ${CREATED}"
echo "Failed: ${FAILED}"
