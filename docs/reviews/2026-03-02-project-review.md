# DanskPrep Project Review

**Date:** 2026-03-02
**Reviewer:** Claude Code (project-review agent)
**App version:** 0.4.1
**Commit:** b9b1d50

## Executive Summary

DanskPrep is a well-architected solo-developer MVP with strong foundations: strict TypeScript, comprehensive i18n (en/da), proper Supabase RLS policies, lazy-loaded routes, and solid FSRS-based spaced repetition. The biggest risks are (1) API keys stored in localStorage accessible via XSS, (2) ~264KB of seed JSON bundled eagerly into chunks that import them, and (3) the `anthropic-dangerous-direct-browser-access` header enabling direct browser-to-API calls which exposes user API keys to network inspection. Top 3 priorities: move AI API calls behind a serverless proxy, lazy-load seed JSON, and add a Content Security Policy.

## Scorecard

| Dimension | Score | Critical | High | Medium | Low |
|-----------|-------|----------|------|--------|-----|
| Security + deps | 6/10 | 0 | 2 | 2 | 1 |
| Tech currency | 8/10 | 0 | 0 | 2 | 2 |
| Data model | 7/10 | 0 | 0 | 2 | 2 |
| Code quality + DX | 7/10 | 0 | 0 | 3 | 2 |
| Accessibility | 5/10 | 0 | 1 | 3 | 2 |
| Performance | 6/10 | 0 | 1 | 2 | 1 |
| Mobile UX | 7/10 | 0 | 0 | 2 | 2 |
| i18n | 8/10 | 0 | 0 | 1 | 2 |
| **Overall** | **6.8/10** | **0** | **4** | **17** | **14** |

## Top 10 Findings (by severity)

| # | Severity | Dimension | Finding | File(s) |
|---|----------|-----------|---------|---------|
| 1 | HIGH | Security | API keys stored in localStorage, exposed to any XSS | `src/lib/ai-provider.ts:56-78`, `src/lib/constants.ts:59-62` |
| 2 | HIGH | Security | Direct browser-to-AI-API calls expose user keys in network tab | `src/lib/ai-provider.ts:137-145` |
| 3 | HIGH | Performance | Seed JSON (~264KB) eagerly imported in hooks/pages, inflating chunks | `src/hooks/useStudy.ts:8-9`, `src/hooks/useWords.ts:2` |
| 4 | HIGH | Accessibility | No skip-to-content link, no focus management on route change | `src/components/layout/Layout.tsx`, `src/App.tsx` |
| 5 | MEDIUM | Security | No Content Security Policy headers | `vercel.json`, `index.html` |
| 6 | MEDIUM | Security | Feedback table allows unauthenticated inserts with no rate limiting | `supabase/migrations/003_add_feedback.sql:14-15` |
| 7 | MEDIUM | Accessibility | FlashCard answer input missing label and Danish keyboard buttons | `src/components/study/FlashCard.tsx:61-70` |
| 8 | MEDIUM | Accessibility | Quiz filter chips and mode toggles lack ARIA roles | `src/pages/QuizPage.tsx:75-95` |
| 9 | MEDIUM | Performance | Dictionary proxy in vite.config.ts imports cheerio on every request | `vite.config.ts:47` |
| 10 | MEDIUM | Code quality | `useStudy` hook is 490+ lines with nested async functions, hard to test | `src/hooks/useStudy.ts` |

## Detailed Findings

### 1. Security + Dependencies

**What's working well:** Environment variables properly gitignored. Supabase RLS is thorough -- every table has policies, user_cards/review_logs are user-scoped, content tables are public-read-only. Migration 008 tightened bubble_scores to enforce ownership. No `dangerouslySetInnerHTML` anywhere. Passwords go through Supabase Auth (never stored client-side). No secrets in source code or seed data.

**Findings:**

**[HIGH] S1: API keys in localStorage.** Four AI provider keys are stored in `localStorage` (`danskprep_anthropic_api_key`, `danskprep_openrouter_key`, `danskprep_openai_api_key`). Any XSS vulnerability -- even from a third-party script -- can read these. While this is a common pattern for client-side-only apps, it is the highest-value target.
- File: `src/lib/ai-provider.ts:56-78`, `src/lib/constants.ts:59-62`
- Fix: Move AI calls behind a Vercel serverless function (like the dictionary endpoint). Store keys server-side or in encrypted session storage. Effort: 1 day.

**[HIGH] S2: `anthropic-dangerous-direct-browser-access` header.** The Anthropic API is called directly from the browser with this header, which Anthropic explicitly warns about. The user's API key is visible in browser DevTools Network tab to anyone with physical access or a browser extension.
- File: `src/lib/ai-provider.ts:144`
- Fix: Proxy through a serverless function. Effort: 1 day (can share the proxy with S1).

**[MEDIUM] S3: No Content Security Policy.** Neither `vercel.json` nor `index.html` sets CSP headers. Without CSP, injected scripts can exfiltrate localStorage keys.
- Fix: Add CSP headers in `vercel.json` (`"headers"` config). Start with `default-src 'self'; script-src 'self'; connect-src 'self' https://*.supabase.co https://api.anthropic.com https://openrouter.ai https://api.openai.com`. Effort: 2 hours.

**[MEDIUM] S4: Unauthenticated feedback inserts.** The `feedback` table allows `INSERT` with `check (true)` -- any anonymous user can spam feedback rows. No rate limiting exists at the database or API level.
- File: `supabase/migrations/003_add_feedback.sql:14-15`
- Fix: Add a rate-limit function or Supabase edge function. Alternatively, restrict to authenticated users only. Effort: 2 hours.

**[LOW] S5: `cheerio` is a production dependency.** It is only used in the Vite dev proxy and the Vercel serverless function, but is listed in `dependencies` (not `devDependencies`), adding ~1.5MB to `node_modules`. It does not affect the client bundle (Vite tree-shakes it) but inflates install time.
- File: `package.json:19`
- Fix: Move to `devDependencies` or keep only in `api/` if the serverless function bundles its own deps. Effort: 5 minutes.

### 2. Tech Currency

**What's working well:** React 18, Vite 6, TypeScript 5.6 strict, Tailwind 3 with shadcn/ui -- all reasonable choices. `ts-fsrs` v4 is current. Supabase client v2 is stable. Code splitting via `React.lazy` for all pages.

**Findings:**

**[MEDIUM] T1: React Router v6 vs v7.** React Router v7 (released late 2024) offers file-based routing, improved data loading, and a Remix-like API. The app uses v6.28 which is still maintained but will reach EOL. No urgency, but worth tracking.
- Fix: Upgrade when ready to adopt loader/action patterns. Effort: 2-4 hours.

**[MEDIUM] T2: Tailwind v3 vs v4.** Tailwind v4 is production-ready with significant performance improvements (CSS-only config). The project explicitly chose v3 for shadcn/ui compatibility, which was valid in 2024 but shadcn/ui now supports v4.
- Fix: Evaluate upgrade when doing a dependency refresh. Effort: 4-6 hours.

**[LOW] T3: TypeScript 5.6 vs 5.8.** TS 5.8 is available. No breaking changes expected. `~5.6.2` pin in package.json is conservative.
- Fix: Bump to `~5.8.0`. Effort: 10 minutes.

**[LOW] T4: ESLint 10 is very recent.** The project uses ESLint 10.0.2 with the flat config. This is current -- no action needed.

### 3. Data Model + Scalability

**What's working well:** Clean normalized schema. Proper FK relationships (exercises -> grammar_topics, exercises -> words). Composite unique constraints where needed (user_cards, user_exercises, user_words). JSONB used appropriately for inflections (variable structure per POS). Good indexing on filter columns (module_level, exercise_type, user_id + due).

**Findings:**

**[MEDIUM] D1: `content_id` in `user_cards` is a text field, not a FK.** It stores `local-exercise-0`, `local-word-0` etc., which are indices into client-side arrays. If the seed data order changes, all user_cards become misaligned. No referential integrity.
- File: `supabase/migrations/001_initial_schema.sql:91`
- Fix: Either (a) use stable UUIDs in seed data and reference them, or (b) add a `content_hash` field for verification. Effort: 4-6 hours (migration + code change).

**[MEDIUM] D2: No `updated_at` trigger on `user_cards`.** The `updated_at` column exists but is only set via client-side code (`new Date().toISOString()`). A DB trigger would be more reliable and resistant to clock skew.
- File: `supabase/migrations/001_initial_schema.sql:102`
- Fix: Add a `moddatetime` trigger or a simple `BEFORE UPDATE` trigger. Effort: 30 minutes.

**[LOW] D3: `exercises.alternatives` allows NULL.** For `multiple_choice` type, alternatives should be required. The schema uses `text[]` without a check constraint. Currently handled in code but not enforced at the DB level.
- Fix: Add a CHECK constraint for `multiple_choice` exercises. Effort: 30 minutes.

**[LOW] D4: Seed data coupling.** Content is loaded from JSON files at import time and mapped by array index (`local-exercise-${i}`). This creates a tight coupling between file order and database state. Adding/removing/reordering exercises would break existing users' FSRS state.
- Fix: Add stable IDs to seed JSON files. Effort: 2 hours.

### 4. Code Quality + Developer Experience

**What's working well:** TypeScript strict mode with `noUnusedLocals` and `noUnusedParameters` -- catches dead code at compile time. Clean component architecture: pages contain layout, hooks contain logic, lib contains utilities. Named exports throughout. Comprehensive test files for answer-check and drill-engine. Damerau-Levenshtein correctly used over standard Levenshtein. `cn()` utility used consistently. Code well-commented where non-obvious.

**Findings:**

**[MEDIUM] C1: `useStudy` hook is too large.** At ~490 lines, this hook handles queue loading, card initialization, top-up, variant building, and review scheduling. It should be split into `useStudyQueue` (data loading) and `useStudyReview` (FSRS scheduling), with `buildWordVariants` extracted to a pure utility.
- File: `src/hooks/useStudy.ts`
- Fix: Extract pure functions, split hook. Effort: 2-3 hours.

**[MEDIUM] C2: Duplicate `shuffle` implementations.** Fisher-Yates shuffle is implemented three times: `src/lib/drill-engine.ts:57-64`, `src/components/quiz/MultipleChoice.tsx:13-20`, and implicitly via `Math.random() - 0.5` in `QuizPage.tsx:62`. The `Math.random` sort is biased and non-uniform.
- Fix: Extract to `src/lib/utils.ts`, replace all usages. Effort: 30 minutes.

**[MEDIUM] C3: `allExercises` computed outside component in QuizPage.** `loadUserExercises()` is called at module evaluation time (line 26-28), meaning it runs once at import and never refreshes when user adds exercises during the session.
- File: `src/pages/QuizPage.tsx:25-28`
- Fix: Move into a `useMemo` or state initializer that refreshes. Effort: 15 minutes.

**[LOW] C4: `eslint-disable` for `react-hooks/purity`.** Two hooks use `useRef(Date.now())` outside of an effect, suppressing the purity lint. This is harmless but could be refactored to use `useRef` + lazy init pattern.
- File: `src/hooks/useQuiz.ts:30`, `src/hooks/useDrill.ts:49`
- Fix: Initialize ref in a `useState` callback or effect. Effort: 10 minutes.

**[LOW] C5: Test coverage gaps.** Only `answer-check.test.ts`, `drill-engine.test.ts`, `DictionaryPage.test.tsx`, and `BubbleLeaderboard.test.tsx` exist. No tests for hooks (`useStudy`, `useQuiz`, `useDrill`), FSRS logic, or i18n.
- Fix: Add hook tests with `@testing-library/react` `renderHook`. Effort: 1-2 days.

### 5. Accessibility

**What's working well:** `<html lang="da">` set correctly. Touch targets follow 44x44px minimum (`min-h-11 min-w-11`). Mobile menu hamburger has `aria-label`. Dark mode uses CSS variables (good contrast in both modes). `DanishInput` buttons have sufficient size. `role="status"` on the page loader.

**Findings:**

**[HIGH] A1: No skip-to-content link.** Screen reader users and keyboard navigators must tab through the header and sidebar (15+ links) before reaching main content. No skip link or landmark navigation exists.
- File: `src/components/layout/Layout.tsx`
- Fix: Add `<a href="#main" class="sr-only focus:not-sr-only ...">Skip to content</a>` and `<main id="main">` around `<Outlet />`. Effort: 15 minutes.

**[MEDIUM] A2: FlashCard active-recall input has no visible label.** The input at `FlashCard.tsx:61-70` uses a placeholder but no `<label>` or `aria-label`. Screen readers will announce it as a generic text input. Also, this input doesn't include the Danish keyboard buttons (ae, oe, aa).
- File: `src/components/study/FlashCard.tsx:61-70`
- Fix: Add `aria-label="Type your answer in Danish"` and consider using `DanishInput` component here. Effort: 30 minutes.

**[MEDIUM] A3: Quiz mode toggle buttons lack ARIA roles.** The quiz/list toggle (`QuizPage.tsx:75-95`) looks like a segmented control but uses plain `<button>` elements without `role="tablist"` / `role="tab"` / `aria-selected`.
- File: `src/pages/QuizPage.tsx:75-95`
- Fix: Add `role="tablist"` on container, `role="tab"` + `aria-selected` on buttons. Effort: 15 minutes.

**[MEDIUM] A4: No focus management on route change.** When navigating between pages, focus stays on the clicked link. Screen reader users lose context. The main content area should receive focus after navigation.
- Fix: Add a `useEffect` in Layout that focuses the main content on route change, or use `react-router`'s `ScrollRestoration` with focus management. Effort: 1 hour.

**[LOW] A5: Color-only feedback indicators.** Quiz feedback uses green/amber/red colors to indicate correct/almost/wrong. Users with color blindness may not distinguish these. The text labels help, but the input border colors alone are insufficient.
- Fix: Add icons (checkmark, warning, X) alongside color indicators. Effort: 30 minutes.

**[LOW] A6: `prefers-reduced-motion` not respected.** Bubble animations, accordion animations, and the scroll-bounce animation run regardless of user motion preferences.
- Fix: Add `@media (prefers-reduced-motion: reduce)` rules. Effort: 30 minutes.

### 6. Performance

**What's working well:** All pages lazy-loaded via `React.lazy` with a Suspense fallback. Vercel analytics and speed insights wired in. Dictionary API response cached with `Cache-Control: public, s-maxage=86400`. Path aliases (`@/`) configured for tree-shaking. Dark mode restored before first render (no FOUC).

**Findings:**

**[HIGH] P1: Seed JSON eagerly bundled.** `exercises-pd3m2.json` (136KB) and `words-pd3m2.json` (100KB) are imported at the top of `useStudy.ts` and `useWords.ts`. Even with code splitting, any page that uses these hooks pulls in ~264KB of JSON. On mobile 3G, this adds ~2-3 seconds to TTI.
- File: `src/hooks/useStudy.ts:8-9`, `src/hooks/useWords.ts:2`
- Fix: Use dynamic `import()` with a loading state, or move seed data behind a lightweight API. Effort: 2-3 hours.

**[MEDIUM] P2: `useStudy` creates new functions on every render.** Functions like `loadQueue`, `loadDailyQueue`, `loadAllQueue`, `initializeUserCards`, `topUpUserCards`, and `buildReviewableCards` are re-created on every render because they aren't wrapped in `useCallback`. While React batches state updates, this could cause unnecessary re-renders in child components.
- File: `src/hooks/useStudy.ts`
- Fix: Wrap data-loading functions in `useCallback` or move to a reducer pattern. Effort: 1 hour.

**[MEDIUM] P3: WelcomePage imports agentation in production.** `WelcomePage.tsx:14` imports `Agentation` unconditionally. While the Layout uses `{import.meta.env.DEV && <Agentation />}`, the WelcomePage also renders it (line 413). The import itself may not be tree-shaken if the component has side effects.
- File: `src/pages/WelcomePage.tsx:14, 413`
- Fix: Wrap in `import.meta.env.DEV &&` conditional import or dynamic import. Effort: 10 minutes.

**[LOW] P4: No image optimization strategy.** The app uses SVG favicon only. If images are added later, there is no `next/image`-style optimization. Vite handles static assets but doesn't optimize automatically.
- Fix: Add `vite-plugin-imagemin` when images are introduced. Effort: N/A until needed.

### 7. Mobile UX

**What's working well:** Mobile-first responsive design. Sidebar collapses to a drawer on mobile with overlay backdrop. Touch targets consistently 44x44px. Danish keyboard buttons are large enough for touch. Header search adapts to mobile (icon only, separate input on Dictionary page). `viewport` meta tag set correctly. `pointer-events-none` on floating bubbles prevents accidental taps.

**Findings:**

**[MEDIUM] M1: No virtual keyboard accommodation for quiz inputs.** When the mobile keyboard appears on quiz/drill pages, it pushes content up. The "Check Answer" button may be hidden behind the keyboard. No `scroll-into-view` or `position: sticky` bottom bar for the submit button.
- Fix: Use `scrollIntoView({ behavior: 'smooth' })` on input focus, or make the submit button sticky at the bottom. Effort: 1-2 hours.

**[MEDIUM] M2: Welcome page `pointer-events-none` pattern is fragile.** The WelcomePage uses `pointer-events-none` on the entire content div, then re-enables for specific elements via `[&_button]:pointer-events-auto [&_a]:pointer-events-auto`. This could break if new interactive elements (e.g., `<select>`, custom dropdowns) are added.
- File: `src/pages/WelcomePage.tsx:144`
- Fix: Use a more targeted approach (z-index layering) or document the pattern for future developers. Effort: 1 hour.

**[LOW] M3: Settings page has long forms.** On mobile, the AI provider settings section is lengthy. No collapsible sections or tabs. Users must scroll through providers they don't use.
- Fix: Collapse non-active provider configs behind an accordion. Effort: 30 minutes.

**[LOW] M4: No safe area insets for notched devices.** The app doesn't use `env(safe-area-inset-*)` for bottom navigation or sticky headers on devices with notches/home indicators.
- Fix: Add `padding-bottom: env(safe-area-inset-bottom)` to fixed/sticky elements. Effort: 15 minutes.

### 8. Internationalization (i18n)

**What's working well:** Full i18n system with React Context (`I18nProvider`), ~495 translation keys each for English and Danish. Language detection from `navigator.language` with localStorage persistence. Toggle in header. Translation keys are type-safe (Danish file uses `Record<TranslationKeys, string>` from English). Parameterized translations (`{email}`, `{count}`) work correctly. Language switcher on both welcome page and app header.

**Findings:**

**[MEDIUM] I1: Some hardcoded English strings remain.** `FlashCard.tsx:79` has "Check" and `FlashCard.tsx:92` has "Show answer" without using `t()`. `FlashCard.tsx:100-102` has "Correct!", "Almost", "You wrote:" hardcoded. `DanishInput.tsx:23` has `placeholder='Type your answer...'` as default. Grammar topic labels in `QuizPage.tsx:30-37` are hardcoded English.
- Files: `src/components/study/FlashCard.tsx:79,92,100-102`, `src/components/ui/DanishInput.tsx:23`, `src/pages/QuizPage.tsx:30-37`
- Fix: Replace with `t()` calls, add keys to both translation files. Effort: 1 hour.

**[LOW] I2: No pluralization support.** The `t()` function uses simple string replacement. Strings like "1 exercises" or "0 days" are not handled with proper plural forms. Danish has simpler pluralization than English, but it still matters for accuracy.
- Fix: Add a plural-aware interpolation function (e.g., `{count, plural, one {# exercise} other {# exercises}}`). Effort: 2 hours.

**[LOW] I3: `<html lang="da">` is hardcoded.** The `lang` attribute in `index.html` is always `da` regardless of the user's selected locale. If the user switches to English, screen readers still announce content as Danish.
- File: `index.html:2`
- Fix: Set `document.documentElement.lang` in the `I18nProvider` when locale changes. Effort: 5 minutes.

## Recommended Action Plan

### Immediate (this week)
1. **Add skip-to-content link** [A1] -- 15 minutes, big a11y win
2. **Add CSP headers** [S3] -- 2 hours, prevents XSS key exfiltration
3. **Fix hardcoded strings** [I1] -- 1 hour, inconsistent UX for Danish users
4. **Fix `<html lang>` to follow locale** [I3] -- 5 minutes
5. **Fix WelcomePage agentation import** [P3] -- 10 minutes

### Short-term (this month)
6. **Move AI calls to serverless proxy** [S1, S2] -- 1-2 days, major security improvement
7. **Lazy-load seed JSON** [P1] -- 2-3 hours, significant mobile performance win
8. **Split `useStudy` hook** [C1] -- 2-3 hours, improves testability
9. **Extract shared `shuffle` utility** [C2] -- 30 minutes
10. **Add ARIA roles to quiz toggle** [A3] -- 15 minutes
11. **Add labels to FlashCard input + use DanishInput** [A2] -- 30 minutes
12. **Add focus management on route change** [A4] -- 1 hour
13. **Fix `allExercises` stale data** [C3] -- 15 minutes

### Long-term (next quarter)
14. **Stabilize seed data IDs** [D1, D4] -- 4-6 hours, prevents user data corruption
15. **Add `updated_at` DB trigger** [D2] -- 30 minutes
16. **Respect `prefers-reduced-motion`** [A6] -- 30 minutes
17. **Mobile virtual keyboard handling** [M1] -- 1-2 hours
18. **Evaluate React Router v7 upgrade** [T1]
19. **Evaluate Tailwind v4 upgrade** [T2]
20. **Expand test coverage** [C5] -- 1-2 days
21. **Add rate limiting on feedback inserts** [S4] -- 2 hours
22. **Add safe area insets** [M4] -- 15 minutes

## Appendix

### Dependency Version Matrix

| Package | Current | Latest (approx) | Risk |
|---------|---------|-----------------|------|
| react | 18.3.1 | 18.3.1 | None |
| react-router-dom | 6.28.0 | 7.x | Low |
| typescript | 5.6.2 | 5.8.x | None |
| tailwindcss | 3.4.16 | 4.x | Medium |
| vite | 6.0.3 | 6.x | None |
| vitest | 2.1.5 | 3.x | Low |
| @supabase/supabase-js | 2.45.0 | 2.x | None |
| ts-fsrs | 4.3.0 | 4.x | None |
| eslint | 10.0.2 | 10.x | None |

### Files Reviewed

**Configuration (7):** `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.js`, `index.html`, `.gitignore`, `vercel.json`

**Migrations (8):** `001_initial_schema.sql`, `002_add_words_danish_unique.sql`, `003_add_feedback.sql`, `004_add_user_exercises.sql`, `005_add_user_words.sql`, `006_add_bubble_leaderboard.sql`, `007_bubble_multi_nickname.sql`, `008_tighten_bubble_rls.sql`

**Core lib (13):** `supabase.ts`, `fsrs.ts`, `answer-check.ts`, `ai-scoring.ts`, `ai-provider.ts`, `user-exercises.ts`, `user-words.ts`, `drill-engine.ts`, `danish-input.ts`, `chat.ts`, `bubble-names.ts`, `constants.ts`, `utils.ts`

**Hooks (11):** `useAuth.ts`, `useStudy.ts`, `useQuiz.ts`, `useDrill.ts`, `useProgress.ts`, `useWords.ts`, `useBubbleGame.ts`, `useRecorder.ts`, `useChat.ts`, `useGrammar.ts`, `useUserExercises.ts`

**Components (12):** `Layout.tsx`, `AuthGuard.tsx`, `Header.tsx`, `Sidebar.tsx`, `PageContainer.tsx`, `FlashCard.tsx`, `MultipleChoice.tsx`, `TypeAnswer.tsx`, `DanishInput.tsx`, `FloatingWords.tsx`, `GamePanel.tsx`, `WelcomeTopBar.tsx`

**Pages (8):** `QuizPage.tsx`, `StudyPage.tsx`, `WelcomePage.tsx`, `DictionaryPage.tsx`, `SettingsPage.tsx`, `HomePage.tsx`, `LoginPage.tsx`, `SignupPage.tsx`

**Other (5):** `App.tsx`, `main.tsx`, `index.css`, `api/dictionary.ts`, `src/lib/i18n.tsx`

**Translation files (2):** `src/data/translations/en.ts` (495 lines), `src/data/translations/da.ts` (496 lines)

**Total: 66 files reviewed**
