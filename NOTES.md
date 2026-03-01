# DanskPrep — Development Notes

This file tracks ongoing improvement tasks, known issues, and session notes.
Update checkboxes as items are completed. Add new findings at the bottom of each section.

---

## Code Review Action Items

### ⚡ High Priority

- [x] **Bundle size — lazy-load routes** *(done 2026-03-02)*
  - `App.tsx` now uses `React.lazy()` for all heavy pages (Study, Grammar, GrammarTopic, Quiz, Vocabulary, Progress, Settings)
  - `<Suspense fallback={<PageLoader />}>` wraps all routes
  - Expected: initial bundle drops from ~500 KB to ~150 KB

- [ ] **Bundle size — lazy-load seed JSON in hooks**
  - `useWords.ts`: replace static `import wordsData from '../data/seed/words-module2.json'` with `const { default: wordsData } = await import(...)` inside the fetch function
  - Same for `useGrammar.ts`, `useQuiz.ts`, `useStudy.ts`
  - This defers ~300 KB of JSON until the page that needs it is visited

- [ ] **`useProgress` refresh after study session**
  - `HomePage` stats (cards due, streak) go stale after returning from `StudyPage`
  - Fix: expose a `refresh()` callback from `useProgress`, pass it as a prop or via context, call it in `StudyPage` on session complete
  - Alternative: pass a `key={sessionId}` prop to `HomePage` to force re-mount

- [ ] **`useStudy` — Supabase sync retry queue**
  - `fsrs-rules.md` specifies: if Supabase sync fails, queue locally and retry
  - Current: throws/logs but loses the review permanently on failure
  - Fix: on sync failure, push to `localStorage` key `danskprep_review_queue` as JSON array; on next successful sync attempt, flush the queue first
  - Queue shape: `{ card_id, rating, reviewed_at, response, was_correct, time_taken_ms }[]`

---

### 🔜 Medium Priority

- [ ] **In-app SpeakSpeak exercise sync (PD3 Module 2)**
  - Allow the user to link their mit.speakspeak.dk account inside the app and pull their enrolled PD3 Module 2 exercises on demand
  - Scope: only scrape if exercises for the requested topic/level are below a threshold (e.g. < 10 available)
  - Implementation sketch:
    1. `SettingsPage.tsx`: add "SpeakSpeak" section with a "Connect / Sync" button
    2. Button opens a Playwright-based local scrape (or a small API route on Vercel that proxies the scrape)
    3. Easiest path for MVP: a CLI script the user runs locally (`uv run python scrape-speakspeak.py --exam PD3M2 --interactive`) — document this in Settings UI with a copy-paste command
    4. Future: if the app gets a server component, trigger scrape server-side and store results in Supabase `exercises` table
  - Dedup logic already exists in `merge_into_seed()` in the scraper
  - Seeds to use: `exercises-pd3m2.json` (34 exercises already scraped)

- [ ] **Thin exercise seed data — PD2 only has ~75 exercises for 6 topics (~12 each)**
  - Target: 30–50 per topic (180–300 total) for PD2
  - Run: `uv run python scrape-speakspeak.py --exam PD2 --cookies cookies.json` once enrolled in a PD2 course
  - Run: `uv run python scrape-gyldendal.py --module 2` after Gyldendal credentials are available
  - Or generate via Claude: `/generate-exercises` skill, 5 types × 6 topics × 5 each
  - PD3 Module 2 already scraped: 34 exercises in `exercises-pd3m2.json`

- [ ] **No `conjugation` or `matching` exercises in seed**
  - Both types are supported by the quiz engine but have zero seed entries
  - Either add ~10 of each type to `exercises-module2.json`, or guard the quiz engine:
    ```typescript
    // quiz-engine.ts — skip types with no available exercises
    const available = exercises.filter(e => e.exercise_type === type)
    if (available.length === 0) continue
    ```

- [ ] **`WordOrder.tsx` — no reorder once word is placed**
  - Currently: click word → appended to answer; no way to fix order without clearing all
  - Fix A (simple): add a click-to-remove on placed words, shown in reverse order with an arrow icon
  - Fix B (proper): use `@dnd-kit/core` for drag-and-drop reordering (install: `npm install @dnd-kit/core @dnd-kit/sortable`)

- [ ] **`useAuth` — no handling of Supabase token expiry mid-session**
  - If a token expires during an active review, Supabase calls silently fail
  - Fix: in `useAuth.ts`, inside the `onAuthStateChange` listener already set up, add:
    ```typescript
    if (event === 'SIGNED_OUT') {
      // navigate away — but useAuth has no access to navigate()
      // solution: set a `sessionExpired` state flag, read it in AuthGuard
    }
    ```
  - Simplest: in `AuthGuard.tsx`, watch `session === null` after initial load and redirect

---

### 📅 Low Priority / Nice-to-Have

- [ ] **`ProgressPage` — `StatsChart` shows numbers only, no visual chart**
  - Add `recharts` (lightweight, tree-shakeable): `npm install recharts`
  - Show a bar chart of reviews per day (last 7 days) using `review_logs` from Supabase
  - Or a donut chart of card states (New / Learning / Review / Relearning)
  - Only fetch chart data when user visits ProgressPage (already lazy-loaded)

- [ ] **Keyboard shortcuts for card ratings (1–4)**
  - File: `src/components/study/CardRating.tsx`
  - Add inside the component (after card is revealed):
    ```typescript
    useEffect(() => {
      const handler = (e: KeyboardEvent) => {
        if (['1','2','3','4'].includes(e.key)) onRate(Number(e.key) as 1|2|3|4)
      }
      window.addEventListener('keydown', handler)
      return () => window.removeEventListener('keydown', handler)
    }, [onRate])
    ```
  - Also show the shortcut hint under each button: `<span class="text-xs text-muted-foreground">1</span>`

- [ ] **`GrammarTopicPage` — no CTA to practice the topic**
  - After reading the grammar rules, there's no "Practice this topic" button
  - Add a button at the bottom of `TopicDetail.tsx` or `GrammarTopicPage.tsx`:
    ```tsx
    <Link to={`/quiz?topic=${topic.slug}`} className={cn(buttonVariants({ variant: 'default' }))}>
      Practice this topic
    </Link>
    ```
  - Requires `QuizPage` to read and pre-filter by `?topic=` query param (`useSearchParams`)

- [ ] **Dark mode not persisted across sessions**
  - `SettingsPage.tsx` toggles a class on `<html>` but it's lost on reload
  - Fix A: in `SettingsPage.tsx`, on toggle, save to `localStorage('danskprep_dark_mode', 'true')`
  - Fix B: in `main.tsx`, before rendering, read `localStorage` and apply the class:
    ```typescript
    if (localStorage.getItem('danskprep_dark_mode') === 'true') {
      document.documentElement.classList.add('dark')
    }
    ```

---

## Completed This Session *(2026-03-02)*

- [x] README rewritten (added live URL, analytics section, roadmap)
- [x] Vercel Analytics + Speed Insights installed and wired into `App.tsx`
- [x] Lazy-loaded routes + `<Suspense>` boundary in `App.tsx`
- [x] `scripts/scrape-speakspeak.py` — Playwright Moodle scraper (with `--exam PD2/PD3M1/PD3M2/PD4` flag)
- [x] `scripts/scrape-gyldendal.py` — Playwright Gyldendal SPA scraper
- [x] Skills: `/scrape-new-site`, `/pull-request`
- [x] `references/speakspeak.md` — full reference for mit.speakspeak.dk (course naming, module mapping, H5P types)
- [x] `references/gyldendal-modultest.md` — placeholder reference for modultest.ibog.gyldendal.dk
- [x] Successfully scraped PD3 Module 2 — 34 exercises → `src/data/seed/exercises-pd3m2.json`
- [x] Seed file naming convention established: existing MVP files keep `module2`; scraped files use `pd2`, `pd3m1`, `pd3m2`

---

## Known Issues / Observations

- **Vercel URL**: Update `README.md` line 8 once the actual deployment URL is known (placeholder: `danskprep.vercel.app`)
- **Supabase not yet connected**: App runs on local seed data. Connect by adding `.env.local` and running the migration
- **Scrapers need manual review**: After running scrapers, search output JSON for `"REVIEW"` and fill in correct answers
- **`npm run types`**: Must be run after connecting Supabase to generate real DB types and replace `createClient<any>()`

---

## Next Session Priorities

1. **In-app SpeakSpeak sync UI** — Settings page "Sync from SpeakSpeak" section with CLI instructions (copy-paste command for local scrape)
2. Connect Supabase + run migration
3. Implement lazy seed JSON loading in hooks (bundle size item)
4. `useProgress` refresh after study session
5. Keyboard shortcuts (1–4) for card ratings — quick win
6. Dark mode persistence fix — quick win
