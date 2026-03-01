# DanskPrep — Development Notes

This file tracks improvement tasks, known issues, and session notes.
Check off items as they are completed. New feature branches are created per item.

---

## 🗂️ Feature Branch Workflow

```
main → feature/A (PR) → feature/B (PR) → feature/C ...
```
Each todo below maps to one feature branch. Branches are chained (B branches from A's merged commit)
so any feature can be rolled back by reverting its PR.

---

## ⚡ High Priority — No Credentials Required (Pure Code)

### 1. useProgress Refresh After Study Session
**Branch:** `feature/progress-refresh`

- `HomePage` stats (cards due, streak) go stale after returning from `StudyPage`
- Fix: expose `refresh()` from `useProgress`, pass it as a prop to `StudyPage`, call on session complete
- Or: pass `key={sessionId}` to force re-mount on return to `HomePage`

### 2. WordOrder Component — Allow Reorder
**Branch:** `feature/wordorder-ux`

Current: click word → appended; no way to fix order without clearing all.

Fix A (simple): click placed word to remove it (append back to available pool)
Fix B (proper): `@dnd-kit/core` drag-and-drop

### 3. Lazy-Load Seed JSON in Hooks
**Branch:** `feature/lazy-seed-json`

Replace static imports in hooks with dynamic imports to defer ~300 KB JSON until needed:
```typescript
// Before: static (always bundled)
import wordsData from '@/data/seed/words-pd3m2.json'

// After: dynamic (only loaded when hook is first called)
const { default: wordsData } = await import('@/data/seed/words-pd3m2.json')
```
Affects: `useStudy.ts`, `useWords.ts`, `useQuiz.ts`, `useGrammar.ts`

---

## 🔐 Requires Credentials

### 4. Connect Supabase
**Needs:** `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local`

Steps:
1. Add `.env.local` with Supabase credentials
2. Run `npx supabase db push` or apply migrations in Supabase dashboard
3. Run `npm run types` to generate real DB types → replace `createClient<any>()` in `src/lib/supabase.ts`
4. Run `python scripts/seed-database.py` to populate DB

### 5. Enrich Vocabulary — Fill 143 Empty Verb Inflections
**Needs:** `ANTHROPIC_API_KEY`

143 common verbs from speakandlearn.dk have empty inflections in `words-pd3m2.json`.

```bash
export ANTHROPIC_API_KEY=sk-ant-...
cd scripts && uv run python enrich-vocabulary.py
```

Uses `claude-haiku-4-5-20251001` — cheap, fast. Expected: ~$0.05 for 143 verbs.

### 6. Danish Grammar PDF → Grammar Enrichment
**Needs:** PDF download + `ANTHROPIC_API_KEY` (for reformatting)

PDF: `https://dn790008.ca.archive.org/0/items/DanishGrammar/Danish%20Grammar.pdf`

Steps:
1. Build `scripts/scrape-grammar-pdf.py` (use `pymupdf` / `pdfminer.six`)
2. Extract text per chapter, map to 6 grammar topic slugs
3. Use Claude to format as `grammar-pd3m2.json` schema (rule_cards, tips, common_mistakes)
4. Current grammar seed is basic stubs — this would make the Grammar section genuinely useful

---

## 🔜 Medium Priority — Code Work

### 7. Supabase Sync Retry Queue
**Branch:** `feature/sync-retry`

If Supabase update fails during review, FSRS state is currently lost.

Fix: on failure, push to `localStorage` key `danskprep_review_queue`. On next load, flush queue first.
Queue shape: `{ card_id, rating, reviewed_at, response, was_correct, time_taken_ms }[]`

---

### 10. In-App Feedback Mode
**Branch:** `feature/feedback-mode`

Allow users to report errors in exercises and suggest improvements.

**Important scope reminder:** This app is for **exam preparation** (PD2, PD3M1, PD3M2 / Prøve i Dansk). Feedback should focus on improving exam-relevant content. Non-exam content will not be added.

Implementation:
- `FeedbackButton` component — small "Report" icon in bottom-right of each exercise card
- `FeedbackDialog` — modal with:
  - "Type" dropdown: `Bug in exercise` | `Wrong answer` | `Wrong explanation` | `Content suggestion`
  - Text area (max 500 chars)
  - Reminder text: *"This app covers PD2, PD3M1, PD3M2 exam content only. Suggestions outside that scope will not be acted on."*
  - Submit → write to Supabase `feedback` table (needs new migration) **or** `mailto:` link if Supabase not yet connected
- `supabase/migrations/003_add_feedback.sql`:
  ```sql
  CREATE TABLE feedback (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    exercise_id text,
    type text NOT NULL,
    message text NOT NULL,
    created_at timestamptz DEFAULT now()
  );
  ```
- Files:
  - `src/components/quiz/FeedbackButton.tsx`
  - `src/components/quiz/FeedbackDialog.tsx`
  - `src/pages/QuizPage.tsx` — wire FeedbackButton into QuizFlow
  - `src/components/study/FlashCard.tsx` — optional: feedback on study cards too

---

## 📅 Low Priority / Nice-to-Have

- [ ] **ProgressPage chart** — add `recharts` bar chart of reviews per day (last 7 days)
- [ ] **useAuth — token expiry handling** — watch `SIGNED_OUT` event in `AuthGuard`
- [ ] **moduletest.dk scraper** — Google OAuth interactive login + module test extraction
- [ ] **Gyldendal modultest scraper** — needs Gyldendal credentials (see `references/gyldendal-modultest.md`)
- [ ] **PD2 / PD3M1 content** — scrape once enrolled in those courses
- [ ] **In-app SpeakSpeak sync UI** — Settings page CLI copy-paste command for local scrape

---

## ✅ Completed

### Session 2026-03-01 cont. (branches: feature/vocab-active-recall, feature/ux-quick-wins, feature/more-exercises)
- [x] **Vocabulary Active Recall** — typing-based study mode with form rotation (verb tenses, noun forms, adjective forms)
- [x] **Auto-suggested ratings** — correct=Good(3), almost=Hard(2), wrong=Again(1) with manual override
- [x] **Dark mode persistence** — `localStorage` read on boot, toggle in Settings
- [x] **Keyboard shortcuts 1–4** — rating cards via number keys with visible hints
- [x] **Grammar "Practice this topic" CTA** — links to `/quiz?topic=slug`, QuizPage pre-filters exercises
- [x] **Exercise expansion** — 201 → 250 exercises; 49 new from SpeakSpeak multi-blank mining:
  - +15 inverted-word-order (adverb cloze + word_order with V2)
  - +10 main-subordinate-clauses (adverb position in subordinate clauses)
  - +13 noun-gender (definite vs indefinite article form MCQs)
  - +11 pronouns (relative pronouns som/der + possessives sin/sit/sine vs hans/hendes)

### Session 2026-03-02 (branch: feature/sdlc-safety-guards)
- [x] **Study mode Daily/All toggle** — `useStudy(user, mode)` hook + `StudyPage.tsx` segmented control
- [x] **Study mode word cards** — vocabulary added to FSRS queue; flashcard shows "at [verb]" / "en/et [noun]" → English
- [x] **Quiz All Questions list mode** — browse all 201 exercises with topic/type filters and answer reveal
- [x] **Vocabulary inflection tables** — `WordDetail.tsx` with POS-specific tables (VerbTable, AdjectiveTable, NounTable)
- [x] **Data enrichment** — exercises: 102 → 201 total (67 hand-crafted from SpeakSpeak analysis)
- [x] **Vocabulary expansion** — words: 71 → 277 (63 irregular verbs with conjugations + 143 common verbs)
- [x] **scripts/scrape-speakandlearn.py** — irregular + common verb scraper
- [x] **scripts/enrich-vocabulary.py** — LLM vocabulary extraction from exercise sentences
- [x] **scripts/analyze-speakspeak.py** — LLM exercise generation from scraped content
- [x] **references/data-sources.md** — all data sources documented (SpeakSpeak, speakandlearn, Gyldendal, moduletest, Danish Grammar PDF)
- [x] **supabase/migrations/002_add_words_danish_unique.sql** — UNIQUE(danish) constraint

### Session 2026-03-01
- [x] README rewritten (live URL placeholder, analytics, roadmap)
- [x] Vercel Analytics + Speed Insights installed and wired into `App.tsx`
- [x] Lazy-loaded routes + `<Suspense>` in `App.tsx`
- [x] `scripts/scrape-speakspeak.py` — Playwright Moodle scraper
- [x] `scripts/scrape-gyldendal.py` — Playwright Gyldendal SPA scraper
- [x] Skills: `/scrape-new-site`, `/pull-request`
- [x] `references/speakspeak.md`, `references/gyldendal-modultest.md`
- [x] Successfully scraped PD3 Module 2 — 35 exercises

---

## Known Issues

- **Supabase not yet connected** — app runs entirely on local seed JSON. Auth and FSRS state won't persist across sessions.
- **143 verbs with empty inflections** — form-test questions will be skipped for these; run `enrich-vocabulary.py` with `ANTHROPIC_API_KEY`
- **WordOrder UX** — no way to reorder placed words without clearing all; click-to-remove or drag-and-drop needed
- **HomePage stats go stale** — `useProgress` doesn't refresh after returning from Study; needs refresh mechanism
- **Scrapers need manual review** — search output JSON for `"REVIEW"` and fill in missing answers
- **`npm run types`** — must be run after Supabase is connected to get real DB types
- **Vercel URL** — update README line 8 once actual deployment URL is known
