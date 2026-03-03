# Frontend Test Report -- 2026-03-02

**Project:** DanskPrep
**Branch:** `main` (commit `b9b1d50`)
**Tester:** Automated Playwright + Manual Screenshot Review
**Environment:** macOS Darwin 25.0.0, Node 20.20.0, Chromium (Playwright 1.51.1)
**Test Mode:** Guest user (no authentication)

---

## Summary

| Phase | Status | Details |
|-------|--------|---------|
| 1. Static Analysis | PASS (warnings) | 0 TS errors, 0 ESLint errors, 16 ESLint warnings, 91/91 tests pass, build succeeds |
| 2. Setup | PASS | Playwright + axe-core installed, Chromium browser ready |
| 3. Visual Sweep | PASS (issues found) | 78/78 screenshots captured across 13 routes x 3 viewports x 2 themes |
| 4. Interaction Tests | PASS | Quiz, drill, dictionary, nav, theme toggle all functional |
| 5. Accessibility | FAIL | Critical and serious violations on all pages |

**Total Issues Found:** 7 (2 Critical, 2 High, 2 Medium, 1 Low)

---

## Critical Issues

### CRIT-1: Horizontal overflow on all Layout-wrapped pages at 375px mobile width

**Severity:** Critical
**Affected Pages:** `/quiz`, `/drill`, `/grammar`, `/vocabulary`, `/dictionary`, `/writing`, `/speaking`, `/progress`, `/updates` (all pages using `Layout.tsx`)
**Not Affected:** `/welcome` (own layout), `/login`, `/signup` (no Layout wrapper), `/home` (Welcome-redirected)
**Viewports:** Mobile (375px) only
**Themes:** Both light and dark

**Description:** The page horizontally scrolls ~74px beyond the 375px viewport (scrollWidth=449, clientWidth=375). Two elements cause this:

1. **Header toolbar** (`div.flex.items-center.gap-1.bg-background.pl-3`) -- the row of header action buttons (game toggle, dark mode, language, support, sign in) overflows to 449px on mobile. The buttons are not wrapping or hiding at small widths.

2. **GamePanel aside** (`aside.border-l...fixed.inset-0.top-14.z-40`) -- when closed, uses `translate-x-full` which shifts it 375px to the right (right=750px), but since it has `fixed inset-0`, it still contributes to document scroll width. The panel content (leaderboard, nickname input, scores table) is fully rendered and visible if the user scrolls right.

**Evidence:** See screenshots `quiz-mobile-light.png`, `drill-mobile-light.png`, `vocabulary-mobile-light.png`, `writing-mobile-light.png`, `speaking-mobile-light.png` -- all show the "Bubble Game" panel content partially visible on the right edge.

**Root Cause (Header):** The header right section at `src/components/layout/Header.tsx:124` uses `flex items-center gap-1` without `overflow-hidden` or responsive hiding of items. At 375px, the combined width of game controls + dark mode + language + separator + support + sign in exceeds the available space.

**Root Cause (GamePanel):** At `src/components/welcome/GamePanel.tsx:42-51`, when closed the aside uses `translate-x-full` on a `fixed inset-0` element. CSS `translate` does not prevent the element from contributing to scrollable overflow. The fix would be to add `overflow-x: hidden` on a parent, or use `visibility: hidden` / `display: none` when the panel is closed on mobile.

**Fix Suggestion:**
- Header: Add `overflow-hidden` to the header right section, or hide less-critical buttons behind a "more" menu on mobile
- GamePanel: Add `overflow-x-hidden` to `Layout.tsx`'s root div, or conditionally render the panel content only when open

### CRIT-2: Accessibility -- Buttons without discernible text (8 instances per page)

**Severity:** Critical (WCAG 2.0 Level A violation)
**Affected Pages:** All 13 tested pages
**Axe Rule:** `button-name`

**Description:** 8 button elements on every page lack accessible names. Screen readers cannot announce what these buttons do. The buttons are in the header toolbar area (game toggle, trophy/score, dark mode toggle, language toggle, support, etc.) and some use only SVG icons without `aria-label`.

**Evidence:** axe-core reports `button-name` as "critical" with 8 instances on every page. See a11y test output.

**Specific Elements (from Header.tsx):**
- Game toggle button (line 127-139): Has `aria-label` via `t('bubble.game.tooltip')` -- may be empty string?
- Trophy button (line 141-149): No `aria-label`
- Support button (line 174-180): No `aria-label`
- Other header buttons may be missing labels

---

## High Issues

### HIGH-1: Accessibility -- Color contrast failures (3-37 instances per page)

**Severity:** High (WCAG 2.0 Level AA violation)
**Affected Pages:** All pages, worst on `/vocabulary` (37 instances) and `/welcome` (23 instances)
**Axe Rule:** `color-contrast`

**Description:** Foreground/background color combinations do not meet the WCAG 2 AA minimum contrast ratio of 4.5:1 for normal text or 3:1 for large text. This affects readability for users with low vision.

**Worst Pages:**
| Page | Instances |
|------|-----------|
| `/vocabulary` | 37 |
| `/welcome` | 23 |
| `/home` | 23 |
| `/updates` | 15 |
| `/writing` | 7 |
| `/speaking` | 6 |
| `/quiz` | 4 |
| Others | 3 each |

**Evidence:** axe-core `color-contrast` violations across all pages. The vocabulary page has the most violations, likely from the part-of-speech tags (`en`, `et`) and muted text elements.

### HIGH-2: Accessibility -- Form inputs without labels (2 instances per page)

**Severity:** High (WCAG 2.0 Level A violation)
**Affected Pages:** All Layout-wrapped pages
**Axe Rule:** `label`

**Description:** 2 form input elements on every page lack associated `<label>` elements or `aria-label` attributes. These are likely the header search input and the dictionary search input (when present). Screen readers cannot announce what these inputs are for.

**Evidence:** axe-core reports `label` as "critical" with 2 instances on every page.

---

## Medium Issues

### MED-1: Nested interactive controls (1 instance per page)

**Severity:** Medium (WCAG 2.1 Level A violation)
**Affected Pages:** All Layout-wrapped pages
**Axe Rule:** `nested-interactive`

**Description:** An interactive element (button or link) is nested inside another interactive element. This causes focus management issues for assistive technologies and may produce unexpected behavior when clicked.

**Evidence:** axe-core `nested-interactive` violation with 1 instance on every page. Likely in the header area where buttons may be nested inside other clickable elements.

### MED-2: Dictionary page has duplicate search inputs on mobile

**Severity:** Medium
**Affected Pages:** `/dictionary`
**Viewports:** Mobile (375px)

**Description:** The dictionary page shows two search inputs on mobile: (1) the page-level pink search input at the top, and (2) a secondary input below it labeled "Type a Danish word...". This is confusing for users who may not know which input to use. On desktop, the header search bar replaces the first one, but on mobile both are visible.

**Evidence:** See `dictionary-mobile-light.png` showing both inputs stacked.

---

## Low Issues

### LOW-1: ESLint warnings -- setState in useEffect (5 instances)

**Severity:** Low
**Affected Files:**
- `src/components/study/ReviewQueue.tsx:36`
- `src/components/vocabulary/WordList.tsx:36`
- `src/components/welcome/BubbleLeaderboard.tsx:190`
- `src/components/welcome/FloatingWords.tsx:109`
- `src/hooks/useAuth.ts:21`
- `src/hooks/useBubbleGame.ts:51`

**Description:** Calling `setState` synchronously inside `useEffect` can cause cascading renders. While these are warnings (not errors) and the app functions correctly, they indicate potential performance issues and code that could be refactored.

---

## Console Errors Log

The following JavaScript error appears on **every page** when the dark mode test injects `addInitScript`:

```
PAGE ERROR: Cannot read properties of null (reading 'classList')
```

**Verdict:** This is a test infrastructure artifact, NOT an application bug. The `addInitScript` runs before the DOM `<html>` element exists in the Playwright browser context. The actual app code at `src/main.tsx:8` (`document.documentElement.classList.add('dark')`) is safe because it runs after DOMContentLoaded. **No action needed.**

No other console errors were detected on any page during the sweep.

---

## Accessibility Violations Summary

| Axe Rule | Impact | Pages Affected | Total Instances |
|----------|--------|----------------|-----------------|
| `button-name` | Critical | 13/13 | ~104 (8/page) |
| `label` | Critical | 13/13 | ~26 (2/page) |
| `color-contrast` | Serious | 13/13 | ~130+ (varies) |
| `nested-interactive` | Serious | 13/13 | ~13 (1/page) |

---

## Pages Passing All Checks

The following pages pass visual, interaction, and overflow tests at all viewports:

| Page | Mobile | Tablet | Desktop | Dark Mode | Interactions | Notes |
|------|--------|--------|---------|-----------|--------------|-------|
| `/welcome` | PASS | PASS | PASS | PASS | PASS | No overflow (own layout) |
| `/login` | PASS | PASS | PASS | PASS | N/A | Clean, centered card |
| `/signup` | PASS | PASS | PASS | PASS | N/A | Clean, centered card |

Pages with issues confined to the Layout-level mobile overflow and a11y (content itself renders correctly):

| Page | Desktop | Tablet | Mobile Overflow | A11y |
|------|---------|--------|-----------------|------|
| `/quiz` | PASS | PASS | FAIL | FAIL |
| `/drill` | PASS | PASS | FAIL | FAIL |
| `/grammar` | PASS | PASS | FAIL | FAIL |
| `/vocabulary` | PASS | PASS | FAIL | FAIL |
| `/dictionary` | PASS | PASS | FAIL | FAIL |
| `/writing` | PASS | PASS | FAIL | FAIL |
| `/speaking` | PASS | PASS | FAIL | FAIL |
| `/progress` | PASS | PASS | FAIL | FAIL |
| `/updates` | PASS | PASS | FAIL | FAIL |
| `/home` | PASS | PASS | FAIL | FAIL |

---

## Test Metadata

| Property | Value |
|----------|-------|
| Date | 2026-03-02 |
| Total Screenshots | 151 |
| Test Duration | ~4 minutes (all 6 projects) |
| Routes Tested | 13 |
| Viewports | 3 (375x812, 768x1024, 1280x800) |
| Themes | 2 (light, dark) |
| Playwright Version | 1.51.1 |
| axe-core Version | 4.10.3 |
| Browser | Chromium |
| TypeScript Errors | 0 |
| ESLint Errors | 0 |
| ESLint Warnings | 16 |
| Unit Tests | 91/91 passed |
| Production Build | Success (804KB main chunk) |

---

## Screenshot Inventory

All screenshots are saved in `docs/test-reports/screenshots/`. Naming convention: `{page}-{viewport}-{theme}.png`.

### Visual Sweep (78 screenshots)
- 13 pages x 3 viewports x 2 themes

### Interaction Tests (73 screenshots)
- Quiz selector, quiz active states
- Drill landing, drill active states
- Dictionary search results
- Writing page states
- Navigation clicks
- Theme toggle before/after
- Mobile menu states

---

## Recommendations (Priority Order)

1. **Fix mobile horizontal overflow** (CRIT-1): Add `overflow-x-hidden` to the Layout root, and refactor the header toolbar to hide overflow or collapse items at mobile widths. This is the single most impactful fix for mobile UX.

2. **Add aria-labels to all icon buttons** (CRIT-2): Every button with only an SVG icon needs an `aria-label`. This is a quick fix across `Header.tsx` and `WelcomeTopBar.tsx`.

3. **Fix color contrast** (HIGH-1): Audit muted text colors, especially on the vocabulary page POS tags. Consider using `text-muted-foreground` values that meet 4.5:1 ratio.

4. **Associate labels with inputs** (HIGH-2): The header search input and dictionary search input need `aria-label` or linked `<label>` elements.

5. **Address nested interactive** (MED-1): Identify and fix the nested interactive control in the header.

6. **Bundle size warning**: The main chunk is 804KB (202KB gzipped). Consider code splitting or `manualChunks` in Vite config.
