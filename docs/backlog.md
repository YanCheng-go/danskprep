# DanskPrep Backlog

> Last updated: 2026-03-03 | Total: 34 | Ready: 21 | Done: 2 | In Progress: 0 | Dropped: 1 | Idea: 10

## Summary

| ID     | Title                                          | Type    | Area       | Pri | Effort | Status | Scope | Deps |
|--------|------------------------------------------------|---------|------------|-----|--------|--------|-------|------|
| BL-001 | Cloud storage for speaking recordings          | feature | ui         | p2  | l      | idea   | all   | —    |
| BL-002 | LLM-based seed data validation script          | infra   | dx         | p2  | m      | ready  | PD3M2 | —    |
| BL-003 | Add post length customization to /some skill   | chore   | dx         | p3  | xs     | ready  | —     | —    |
| BL-004 | Add skip-to-content link                       | chore   | ui         | p1  | xs     | ready  | all   | —    |
| BL-005 | Add Content Security Policy headers            | infra   | dx         | p2  | s      | ready  | all   | —    |
| BL-006 | Fix hardcoded English strings in i18n          | bug     | ui         | p2  | s      | ready  | all   | —    |
| BL-007 | Set html lang attribute from locale            | bug     | ui         | p3  | xs     | ready  | all   | —    |
| BL-008 | Fix WelcomePage agentation prod import         | bug     | ui         | p2  | xs     | ready  | all   | —    |
| BL-009 | Move AI calls to serverless proxy              | feature | auth       | p1  | l      | ready  | all   | —    |
| BL-010 | Lazy-load seed JSON for performance            | chore   | ui         | p1  | m      | ready  | all   | —    |
| BL-011 | Split useStudy hook into smaller hooks         | chore   | dx         | p2  | m      | ready  | all   | —    |
| BL-012 | Extract shared shuffle utility                 | chore   | dx         | p2  | xs     | ready  | all   | —    |
| BL-013 | Add ARIA roles to quiz mode toggle             | chore   | ui         | p2  | xs     | ready  | all   | —    |
| BL-014 | Add label + DanishInput to FlashCard           | chore   | ui         | p2  | s      | ready  | all   | —    |
| BL-015 | Add focus management on route change           | chore   | ui         | p2  | s      | ready  | all   | —    |
| BL-016 | Fix allExercises stale data in QuizPage        | bug     | quiz       | p2  | xs     | ready  | all   | —    |
| BL-017 | Stabilize seed data IDs                        | chore   | db         | p2  | l      | idea   | all   | —    |
| BL-018 | Add updated_at DB trigger                      | chore   | db         | p2  | xs     | idea   | all   | —    |
| BL-019 | Respect prefers-reduced-motion                 | chore   | ui         | p3  | xs     | idea   | all   | —    |
| BL-020 | Mobile virtual keyboard handling               | feature | ui         | p2  | s      | idea   | all   | —    |
| BL-021 | Evaluate React Router v7 upgrade               | chore   | dx         | p3  | m      | idea   | all   | —    |
| BL-022 | Evaluate Tailwind v4 upgrade                   | chore   | dx         | p3  | m      | idea   | all   | —    |
| BL-023 | Expand test coverage for hooks                 | chore   | dx         | p3  | l      | idea   | all   | —    |
| BL-024 | Add rate limiting on feedback inserts           | infra   | db         | p2  | s      | ready  | all   | —    |
| BL-025 | Add safe area insets for notched devices        | chore   | ui         | p3  | xs     | idea   | all   | —    |
| BL-026 | Fix mobile horizontal overflow in Layout       | bug     | ui         | p0  | s      | done   | all   | —    |
| BL-027 | Add aria-labels to all icon buttons            | bug     | ui         | p0  | xs     | done   | all   | —    |
| BL-028 | Fix color contrast to meet WCAG AA             | bug     | ui         | p1  | m      | ready  | all   | —    |
| BL-029 | Add labels to header/dictionary search inputs  | bug     | ui         | p1  | xs     | ready  | all   | —    |
| BL-030 | Fix nested interactive control in header       | bug     | ui         | p2  | xs     | ready  | all   | —    |
| BL-031 | Fix duplicate search inputs on dict mobile     | bug     | ui         | p2  | xs     | dropped| all   | —    |
| BL-032 | Integrate local Danish LLM for app features    | feature | vocabulary | p1  | xl     | ready  | all   | —    |
| BL-033 | Redesign mobile header — move icons to sidebar | feature | ui         | p1  | m      | ready  | all   | —    |
| BL-034 | Evaluate backlog file vs GitHub Projects       | chore   | dx         | p3  | s      | idea   | —     | —    |

## Items

<!-- New items appended below in ID order -->

### BL-001: Cloud storage for speaking recordings

- **Type:** feature | **Area:** ui | **Priority:** p2 | **Effort:** l
- **Status:** idea | **Scope:** all
- **Created:** 2026-03-02
- **Dependencies:** none

Audio recordings on /speaking are currently only held in-memory (blob URLs) and lost on page leave. Add cloud storage (Supabase Storage or similar) so users can save, replay, and track their speaking practice over time.

#### Notes

_No notes yet._

---

### BL-002: LLM-based seed data validation script

- **Type:** infra | **Area:** dx | **Priority:** p2 | **Effort:** m
- **Status:** ready | **Scope:** PD3M2
- **Created:** 2026-03-02
- **Dependencies:** none

Build a Python script (`scripts/validate-seed-data.py`) that uses Claude to scan all seed JSON files and flag data quality issues proactively.

**What it validates:**
- Null/empty fields where values are expected (e.g., word with no `english`, exercise with no `explanation`)
- Schema consistency across entries (same fields present on all items of the same type)
- Danish text quality — grammar errors, missing articles, wrong inflection patterns
- Exercise quality — cloze with ambiguous blanks, MC with <4 options, word_order with multiple valid orderings
- Duplicate detection — similar exercises or words that may be redundant
- Missing cross-references — exercises referencing grammar topics that don't exist
- Format violations — wrong exercise_type values, invalid difficulty ratings, malformed JSONB fields

**Implementation approach:**
- Read each seed file, validate schema with a JSON schema or Pydantic model first (fast, free)
- For content quality checks, batch entries and send to Claude Haiku (cheap: ~$0.02 per full scan)
- Output a validation report with severity levels (error/warning/info) and line references
- Can be run in CI or manually before releases

**Acceptance criteria:**
- Script runs via `cd scripts && uv run python validate-seed-data.py`
- Catches the known issue: 143 verbs with empty inflections
- Zero false positives on current clean data (exercises, grammar, prompts)
- Report format: JSON or markdown, machine-readable for CI integration

#### Notes

_No notes yet._

---

### BL-003: Add post length customization to /some skill

- **Type:** chore | **Area:** dx | **Priority:** p3 | **Effort:** xs
- **Status:** ready | **Scope:** —
- **Created:** 2026-03-02
- **Dependencies:** none

The `/some` skill currently generates posts at a fixed length per platform. Add a `--length` flag (short/medium/long) so users can control verbosity for different contexts. Short = hook + 2-3 lines + CTA. Medium = current default. Long = full story with background and details.

#### Notes

_No notes yet._

---

### BL-004: Add skip-to-content link

- **Type:** chore | **Area:** ui | **Priority:** p1 | **Effort:** xs
- **Status:** ready | **Scope:** all
- **Created:** 2026-03-02
- **Dependencies:** none
- **Review ref:** A1

Screen reader users and keyboard navigators must tab through the header and sidebar (15+ links) before reaching main content. Add `<a href="#main" class="sr-only focus:not-sr-only ...">Skip to content</a>` and `<main id="main">` around `<Outlet />`.

**Files:** `src/components/layout/Layout.tsx`, `src/App.tsx`
**Effort estimate:** 15 minutes

#### Notes

_No notes yet._

---

### BL-005: Add Content Security Policy headers

- **Type:** infra | **Area:** dx | **Priority:** p2 | **Effort:** s
- **Status:** ready | **Scope:** all
- **Created:** 2026-03-02
- **Dependencies:** none
- **Review ref:** S3

Neither `vercel.json` nor `index.html` sets CSP headers. Without CSP, injected scripts can exfiltrate localStorage keys. Add CSP headers in `vercel.json`: `default-src 'self'; script-src 'self'; connect-src 'self' https://*.supabase.co https://api.anthropic.com https://openrouter.ai https://api.openai.com`.

**Files:** `vercel.json`, `index.html`
**Effort estimate:** 2 hours

#### Notes

_No notes yet._

---

### BL-006: Fix hardcoded English strings in i18n

- **Type:** bug | **Area:** ui | **Priority:** p2 | **Effort:** s
- **Status:** ready | **Scope:** all
- **Created:** 2026-03-02
- **Dependencies:** none
- **Review ref:** I1

Several components have hardcoded English strings instead of using `t()`: `FlashCard.tsx:79` ("Check"), `FlashCard.tsx:92` ("Show answer"), `FlashCard.tsx:100-102` ("Correct!", "Almost", "You wrote:"), `DanishInput.tsx:23` (placeholder), `QuizPage.tsx:30-37` (grammar topic labels).

**Files:** `src/components/study/FlashCard.tsx`, `src/components/ui/DanishInput.tsx`, `src/pages/QuizPage.tsx`
**Effort estimate:** 1 hour

#### Notes

_No notes yet._

---

### BL-007: Set html lang attribute from locale

- **Type:** bug | **Area:** ui | **Priority:** p3 | **Effort:** xs
- **Status:** ready | **Scope:** all
- **Created:** 2026-03-02
- **Dependencies:** none
- **Review ref:** I3

`<html lang="da">` is hardcoded in `index.html` regardless of user's selected locale. When user switches to English, screen readers still announce content as Danish. Set `document.documentElement.lang` in the `I18nProvider` when locale changes.

**Files:** `index.html`, `src/lib/i18n.tsx`
**Effort estimate:** 5 minutes

#### Notes

_No notes yet._

---

### BL-008: Fix WelcomePage agentation prod import

- **Type:** bug | **Area:** ui | **Priority:** p2 | **Effort:** xs
- **Status:** ready | **Scope:** all
- **Created:** 2026-03-02
- **Dependencies:** none
- **Review ref:** P3

`WelcomePage.tsx:14` imports `Agentation` unconditionally. While Layout uses `{import.meta.env.DEV && <Agentation />}`, WelcomePage also renders it (line 413). The import may not be tree-shaken if the component has side effects.

**Files:** `src/pages/WelcomePage.tsx`
**Effort estimate:** 10 minutes

#### Notes

_No notes yet._

---

### BL-009: Move AI calls to serverless proxy

- **Type:** feature | **Area:** auth | **Priority:** p1 | **Effort:** l
- **Status:** ready | **Scope:** all
- **Created:** 2026-03-02
- **Dependencies:** none
- **Review ref:** S1+S2

API keys stored in localStorage are exposed to XSS. Direct browser-to-AI-API calls with `anthropic-dangerous-direct-browser-access` header expose user keys in network tab. Move AI calls behind a Vercel serverless function, store keys server-side.

**Files:** `src/lib/ai-provider.ts`, `src/lib/constants.ts`, `api/`
**Effort estimate:** 1-2 days

#### Notes

_No notes yet._

---

### BL-010: Lazy-load seed JSON for performance

- **Type:** chore | **Area:** ui | **Priority:** p1 | **Effort:** m
- **Status:** ready | **Scope:** all
- **Created:** 2026-03-02
- **Dependencies:** none
- **Review ref:** P1

`exercises-pd3m2.json` (136KB) and `words-pd3m2.json` (100KB) are eagerly imported in `useStudy.ts` and `useWords.ts`, inflating chunks by ~264KB. On mobile 3G, adds ~2-3 seconds to TTI. Use dynamic `import()` with a loading state.

**Files:** `src/hooks/useStudy.ts`, `src/hooks/useWords.ts`
**Effort estimate:** 2-3 hours

#### Notes

_No notes yet._

---

### BL-011: Split useStudy hook into smaller hooks

- **Type:** chore | **Area:** dx | **Priority:** p2 | **Effort:** m
- **Status:** ready | **Scope:** all
- **Created:** 2026-03-02
- **Dependencies:** none
- **Review ref:** C1

`useStudy` is ~490 lines handling queue loading, card initialization, top-up, variant building, and review scheduling. Split into `useStudyQueue` (data loading) and `useStudyReview` (FSRS scheduling), extract `buildWordVariants` to a pure utility.

**Files:** `src/hooks/useStudy.ts`
**Effort estimate:** 2-3 hours

#### Notes

_No notes yet._

---

### BL-012: Extract shared shuffle utility

- **Type:** chore | **Area:** dx | **Priority:** p2 | **Effort:** xs
- **Status:** ready | **Scope:** all
- **Created:** 2026-03-02
- **Dependencies:** none
- **Review ref:** C2

Fisher-Yates shuffle is implemented 3 times: `drill-engine.ts:57-64`, `MultipleChoice.tsx:13-20`, and via biased `Math.random() - 0.5` in `QuizPage.tsx:62`. Extract to `src/lib/utils.ts`, replace all usages.

**Files:** `src/lib/drill-engine.ts`, `src/components/quiz/MultipleChoice.tsx`, `src/pages/QuizPage.tsx`, `src/lib/utils.ts`
**Effort estimate:** 30 minutes

#### Notes

_No notes yet._

---

### BL-013: Add ARIA roles to quiz mode toggle

- **Type:** chore | **Area:** ui | **Priority:** p2 | **Effort:** xs
- **Status:** ready | **Scope:** all
- **Created:** 2026-03-02
- **Dependencies:** none
- **Review ref:** A3

Quiz/list toggle (`QuizPage.tsx:75-95`) uses plain `<button>` without `role="tablist"` / `role="tab"` / `aria-selected`. Add proper ARIA roles for screen reader support.

**Files:** `src/pages/QuizPage.tsx`
**Effort estimate:** 15 minutes

#### Notes

_No notes yet._

---

### BL-014: Add label + DanishInput to FlashCard

- **Type:** chore | **Area:** ui | **Priority:** p2 | **Effort:** s
- **Status:** ready | **Scope:** all
- **Created:** 2026-03-02
- **Dependencies:** none
- **Review ref:** A2

FlashCard answer input (`FlashCard.tsx:61-70`) uses placeholder but no `<label>` or `aria-label`. Screen readers announce it as generic text input. Also missing Danish keyboard buttons (æ, ø, å). Add `aria-label` and consider using `DanishInput` component.

**Files:** `src/components/study/FlashCard.tsx`
**Effort estimate:** 30 minutes

#### Notes

_No notes yet._

---

### BL-015: Add focus management on route change

- **Type:** chore | **Area:** ui | **Priority:** p2 | **Effort:** s
- **Status:** ready | **Scope:** all
- **Created:** 2026-03-02
- **Dependencies:** none
- **Review ref:** A4

When navigating between pages, focus stays on the clicked link. Screen reader users lose context. Add a `useEffect` in Layout that focuses the main content on route change, or use `react-router`'s `ScrollRestoration` with focus management.

**Files:** `src/components/layout/Layout.tsx`
**Effort estimate:** 1 hour

#### Notes

_No notes yet._

---

### BL-016: Fix allExercises stale data in QuizPage

- **Type:** bug | **Area:** quiz | **Priority:** p2 | **Effort:** xs
- **Status:** ready | **Scope:** all
- **Created:** 2026-03-02
- **Dependencies:** none
- **Review ref:** C3

`loadUserExercises()` is called at module evaluation time (`QuizPage.tsx:25-28`), meaning it runs once at import and never refreshes when user adds exercises during the session. Move into a `useMemo` or state initializer that refreshes.

**Files:** `src/pages/QuizPage.tsx`
**Effort estimate:** 15 minutes

#### Notes

_No notes yet._

---

### BL-017: Stabilize seed data IDs

- **Type:** chore | **Area:** db | **Priority:** p2 | **Effort:** l
- **Status:** idea | **Scope:** all
- **Created:** 2026-03-02
- **Dependencies:** none
- **Review ref:** D1+D4

`content_id` in `user_cards` stores `local-exercise-0` etc. — indices into client-side arrays. If seed data order changes, all user_cards become misaligned. Add stable UUIDs to seed JSON files and use as content_id.

**Files:** `supabase/migrations/001_initial_schema.sql`, `src/data/seed/*.json`
**Effort estimate:** 4-6 hours

#### Notes

_No notes yet._

---

### BL-018: Add updated_at DB trigger

- **Type:** chore | **Area:** db | **Priority:** p2 | **Effort:** xs
- **Status:** idea | **Scope:** all
- **Created:** 2026-03-02
- **Dependencies:** none
- **Review ref:** D2

The `updated_at` column on `user_cards` is only set via client-side code. A DB trigger would be more reliable and resistant to clock skew. Add a `moddatetime` trigger or simple `BEFORE UPDATE` trigger.

**Files:** `supabase/migrations/`
**Effort estimate:** 30 minutes

#### Notes

_No notes yet._

---

### BL-019: Respect prefers-reduced-motion

- **Type:** chore | **Area:** ui | **Priority:** p3 | **Effort:** xs
- **Status:** idea | **Scope:** all
- **Created:** 2026-03-02
- **Dependencies:** none
- **Review ref:** A6

Bubble animations, accordion animations, and scroll-bounce run regardless of user motion preferences. Add `@media (prefers-reduced-motion: reduce)` rules.

**Files:** `src/index.css`, animation components
**Effort estimate:** 30 minutes

#### Notes

_No notes yet._

---

### BL-020: Mobile virtual keyboard handling

- **Type:** feature | **Area:** ui | **Priority:** p2 | **Effort:** s
- **Status:** idea | **Scope:** all
- **Created:** 2026-03-02
- **Dependencies:** none
- **Review ref:** M1

When mobile keyboard appears on quiz/drill pages, it pushes content up. "Check Answer" button may be hidden. Use `scrollIntoView({ behavior: 'smooth' })` on input focus or make submit button sticky at bottom.

**Files:** Quiz and drill page components
**Effort estimate:** 1-2 hours

#### Notes

_No notes yet._

---

### BL-021: Evaluate React Router v7 upgrade

- **Type:** chore | **Area:** dx | **Priority:** p3 | **Effort:** m
- **Status:** idea | **Scope:** all
- **Created:** 2026-03-02
- **Dependencies:** none
- **Review ref:** T1

React Router v7 offers file-based routing, improved data loading, Remix-like API. Current v6.28 still maintained but will reach EOL. Evaluate when ready to adopt loader/action patterns.

**Effort estimate:** 2-4 hours

#### Notes

_No notes yet._

---

### BL-022: Evaluate Tailwind v4 upgrade

- **Type:** chore | **Area:** dx | **Priority:** p3 | **Effort:** m
- **Status:** idea | **Scope:** all
- **Created:** 2026-03-02
- **Dependencies:** none
- **Review ref:** T2

Tailwind v4 is production-ready with CSS-only config and perf improvements. shadcn/ui now supports v4. Project chose v3 for compatibility — re-evaluate.

**Effort estimate:** 4-6 hours

#### Notes

_No notes yet._

---

### BL-023: Expand test coverage for hooks

- **Type:** chore | **Area:** dx | **Priority:** p3 | **Effort:** l
- **Status:** idea | **Scope:** all
- **Created:** 2026-03-02
- **Dependencies:** none
- **Review ref:** C5

Only `answer-check.test.ts`, `drill-engine.test.ts`, `DictionaryPage.test.tsx`, and `BubbleLeaderboard.test.tsx` exist. No tests for hooks (`useStudy`, `useQuiz`, `useDrill`), FSRS logic, or i18n. Add hook tests with `@testing-library/react` `renderHook`.

**Effort estimate:** 1-2 days

#### Notes

_No notes yet._

---

### BL-024: Add rate limiting on feedback inserts

- **Type:** infra | **Area:** db | **Priority:** p2 | **Effort:** s
- **Status:** ready | **Scope:** all
- **Created:** 2026-03-02
- **Dependencies:** none
- **Review ref:** S4

Feedback table allows unauthenticated inserts with `check (true)` — any anonymous user can spam rows. Add a rate-limit function or restrict to authenticated users only.

**Files:** `supabase/migrations/003_add_feedback.sql`
**Effort estimate:** 2 hours

#### Notes

_No notes yet._

---

### BL-025: Add safe area insets for notched devices

- **Type:** chore | **Area:** ui | **Priority:** p3 | **Effort:** xs
- **Status:** idea | **Scope:** all
- **Created:** 2026-03-02
- **Dependencies:** none
- **Review ref:** M4

App doesn't use `env(safe-area-inset-*)` for bottom navigation or sticky headers on devices with notches/home indicators. Add `padding-bottom: env(safe-area-inset-bottom)` to fixed/sticky elements.

**Files:** `src/index.css`, Layout components
**Effort estimate:** 15 minutes

#### Notes

_No notes yet._

---

### BL-026: Fix mobile horizontal overflow in Layout

- **Type:** bug | **Area:** ui | **Priority:** p0 | **Effort:** s
- **Status:** done | **Scope:** all
- **Created:** 2026-03-02 | **Closed:** 2026-03-03
- **Dependencies:** none
- **Test ref:** CRIT-1
- **PR:** #35

All Layout-wrapped pages horizontally scroll ~74px beyond the 375px viewport (scrollWidth=449). Two root causes:

1. **Header toolbar** (`Header.tsx:124`) — the row of action buttons (game toggle, dark mode, language, support, sign in) overflows without wrapping or hiding at small widths.
2. **GamePanel aside** (`GamePanel.tsx:42-51`) — when closed, uses `translate-x-full` on a `fixed inset-0` element, which still contributes to scrollable width. Panel content (leaderboard, scores) is visible if user scrolls right.

**Fix suggestions:**
- Header: Add `overflow-hidden` to the right section, or hide less-critical buttons behind a "more" menu on mobile
- GamePanel: Add `overflow-x-hidden` to Layout root, or conditionally render panel content only when open

**Affected pages:** `/quiz`, `/drill`, `/grammar`, `/vocabulary`, `/dictionary`, `/writing`, `/speaking`, `/progress`, `/updates`
**Not affected:** `/welcome` (own layout), `/login`, `/signup`

**Files:** `src/components/layout/Header.tsx`, `src/components/welcome/GamePanel.tsx`, `src/components/layout/Layout.tsx`

#### Notes

_No notes yet._

---

### BL-027: Add aria-labels to all icon buttons

- **Type:** bug | **Area:** ui | **Priority:** p0 | **Effort:** xs
- **Status:** done | **Scope:** all
- **Created:** 2026-03-02 | **Closed:** 2026-03-03
- **Dependencies:** none
- **Test ref:** CRIT-2
- **PR:** #35

8 button elements on every page lack accessible names. Screen readers cannot announce what they do. Buttons are in the header toolbar (game toggle, trophy/score, dark mode toggle, language toggle, support, etc.) using only SVG icons without `aria-label`. WCAG 2.0 Level A violation (`button-name` rule), ~104 instances across all pages.

**Files:** `src/components/layout/Header.tsx`, `src/components/welcome/WelcomeTopBar.tsx`

#### Notes

_No notes yet._

---

### BL-028: Fix color contrast to meet WCAG AA

- **Type:** bug | **Area:** ui | **Priority:** p1 | **Effort:** m
- **Status:** ready | **Scope:** all
- **Created:** 2026-03-02
- **Dependencies:** none
- **Test ref:** HIGH-1

Foreground/background color combinations fail WCAG AA minimum (4.5:1 for text, 3:1 for large text). Worst pages: `/vocabulary` (37 instances), `/welcome` (23), `/updates` (15). Likely from muted text colors and POS tags. ~130+ total instances.

**Fix:** Audit muted text colors. Use `text-muted-foreground` values that meet 4.5:1 ratio.

#### Notes

_No notes yet._

---

### BL-029: Add labels to header/dictionary search inputs

- **Type:** bug | **Area:** ui | **Priority:** p1 | **Effort:** xs
- **Status:** ready | **Scope:** all
- **Created:** 2026-03-02
- **Dependencies:** none
- **Test ref:** HIGH-2

2 form input elements on every page lack associated `<label>` or `aria-label`. Likely the header search input and dictionary search input. WCAG 2.0 Level A violation (`label` rule), ~26 instances total.

**Files:** `src/components/layout/Header.tsx`, `src/pages/DictionaryPage.tsx`

#### Notes

_No notes yet._

---

### BL-030: Fix nested interactive control in header

- **Type:** bug | **Area:** ui | **Priority:** p2 | **Effort:** xs
- **Status:** ready | **Scope:** all
- **Created:** 2026-03-02
- **Dependencies:** none
- **Test ref:** HIGH-3

Header search bar is wrapped inside a `<button>` or clickable parent, creating a nested interactive control. Screen readers and keyboard navigation behave unpredictably with nested focusable elements.

**Files:** `src/components/layout/Header.tsx`

#### Notes

_No notes yet._

---

### BL-031: Fix duplicate search inputs on dict mobile

- **Type:** bug | **Area:** ui | **Priority:** p2 | **Effort:** xs
- **Status:** dropped | **Scope:** all
- **Created:** 2026-03-02
- **Dependencies:** none

~~On mobile, the dictionary page shows both the header search icon and the page-level search input, creating duplicate search entry points.~~

**Dropped:** Subsumed by BL-033 (mobile header redesign), which moves all utility icons including search into the sidebar on mobile.

#### Notes

_No notes yet._

---

### BL-032: Integrate local Danish LLM for app features

- **Type:** feature | **Area:** vocabulary | **Priority:** p1 | **Effort:** xl
- **Status:** ready | **Scope:** all
- **Created:** 2026-03-03
- **Dependencies:** none

Integrate a local Danish-optimized LLM (e.g., Munin models from ScandEval) for vocabulary enrichment, exercise generation, and answer checking without requiring cloud API keys.

#### Notes

_No notes yet._

---

### BL-033: Redesign mobile header — move utility icons to sidebar

- **Type:** feature | **Area:** ui | **Priority:** p1 | **Effort:** m
- **Status:** ready | **Scope:** all
- **Created:** 2026-03-03
- **Dependencies:** none
- **Plan:** `docs/plans/mobile-header-redesign.md`

Three mobile header issues combined into one redesign:

1. **Duplicate dictionary search** — header search icon + page search input both visible on mobile
2. **Hidden header icons** — game controls and utility buttons overflow on narrow screens
3. **Sidebar-header gap** — 1px visual gap between header and mobile sidebar drawer

**Solution:** Move all utility icons (search, dark mode, language, game, support, sign in/out) into a "Quick Actions" section in the sidebar, visible only on mobile (`md:hidden`). Header becomes minimal: hamburger + logo + module selector.

**Files:** `Layout.tsx`, `Header.tsx`, `Sidebar.tsx`, `DictionaryPage.tsx`, translation files

**Subsumes:** BL-031 (duplicate search inputs)

See full implementation plan at `docs/plans/mobile-header-redesign.md`.

#### Notes

_No notes yet._

---

### BL-034: Evaluate backlog file vs GitHub Projects

- **Type:** chore | **Area:** dx | **Priority:** p3 | **Effort:** s
- **Status:** idea | **Scope:** —
- **Created:** 2026-03-03
- **Dependencies:** none

Investigate whether the current `docs/backlog.md` file-based approach or GitHub Projects (board/table views, automation, labels) is better for project planning and tracking. Compare on these dimensions:

- **Discoverability** — how easy is it for contributors to find and understand the backlog?
- **AI-agent compatibility** — can Claude Code and other AI agents read/write items effectively?
- **Filtering & sorting** — how well does each handle priority, area, status filters?
- **Offline access** — does it work without network (important for Nix/local-first workflow)?
- **Version control** — is the planning history tracked in git alongside code changes?
- **Overhead** — how much friction does each add to the daily workflow?
- **Automation** — can items auto-close on PR merge, auto-assign, etc.?

Produce a short recommendation in `docs/spikes/` with a clear "keep file" or "migrate to GitHub Projects" verdict.

#### Notes

_No notes yet._

---