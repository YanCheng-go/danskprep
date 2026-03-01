# DanskPrep — Danish Exam Preparation App

## Project Overview

DanskPrep is an exam-focused Danish language learning web app. The scope is strictly what gets tested in Danish exams (Prøve i Dansk). It uses evidence-based learning techniques: spaced repetition (FSRS algorithm), active recall, typed production, cloze deletion, and sentence construction.

**Current Phase:** MVP — Module 2 exam content
**Target Exams:** Module 1–5 tests, PD1, PD2, PD3, Studieprøven

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React + Vite | React 18+, Vite 5+ |
| Language | TypeScript | 5.x, strict mode |
| Styling | Tailwind CSS + shadcn/ui | Tailwind 3.x |
| SRS Engine | ts-fsrs | Latest (client-side scheduling) |
| Backend/DB | Supabase | Free tier (PostgreSQL + Auth + REST API) |
| Hosting | Vercel | Free tier |
| Package Manager | npm | — |

## Project Structure

```
danskprep/
├── CLAUDE.md
├── .claude/
│   └── skills/               # Skill files for Claude Code
├── public/
├── src/
│   ├── components/
│   │   ├── layout/           # Header, Sidebar, Footer, PageContainer
│   │   ├── study/            # Flashcard, ReviewQueue, CardRating
│   │   ├── quiz/             # TypeAnswer, MultipleChoice, Cloze, WordOrder, ErrorCorrection
│   │   ├── grammar/          # TopicList, TopicDetail, RuleCard, ExampleBlock
│   │   ├── progress/         # Dashboard, StatsChart, StreakCounter, TopicProgress
│   │   ├── vocabulary/       # WordList, WordDetail, InflectionTable
│   │   └── ui/               # shadcn components (Button, Input, Card, Dialog, etc.)
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── StudyPage.tsx     # Daily review queue
│   │   ├── GrammarPage.tsx   # Grammar topics list
│   │   ├── GrammarTopicPage.tsx  # Single grammar topic detail
│   │   ├── QuizPage.tsx      # Quiz mode selection + quiz flow
│   │   ├── VocabularyPage.tsx
│   │   ├── ProgressPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── SignupPage.tsx
│   │   └── SettingsPage.tsx
│   ├── lib/
│   │   ├── supabase.ts       # Supabase client init
│   │   ├── fsrs.ts           # FSRS wrapper: scheduling, card state management
│   │   ├── quiz-engine.ts    # Quiz logic: generate questions, check answers, score
│   │   ├── danish-input.ts   # æøå keyboard helper utilities
│   │   ├── utils.ts          # General utilities
│   │   └── constants.ts      # App-wide constants
│   ├── hooks/
│   │   ├── useAuth.ts        # Authentication state
│   │   ├── useStudy.ts       # FSRS card queue, review flow
│   │   ├── useQuiz.ts        # Quiz session state
│   │   ├── useWords.ts       # Vocabulary data fetching
│   │   ├── useGrammar.ts     # Grammar topics fetching
│   │   └── useProgress.ts    # Stats and progress data
│   ├── types/
│   │   ├── database.ts       # Supabase generated types
│   │   ├── study.ts          # FSRS card types, review types
│   │   ├── quiz.ts           # Quiz question types, answer types
│   │   └── grammar.ts        # Grammar topic types
│   ├── data/
│   │   └── seed/             # JSON seed files
│   │       ├── words-module2.json
│   │       ├── grammar-module2.json
│   │       ├── exercises-module2.json
│   │       └── sentences-module2.json
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── seed.sql
├── scripts/
│   ├── import-words.py       # Import from dansk-api-ordbog
│   ├── generate-exercises.py # Generate exercises via Claude API
│   └── seed-database.py      # Push seed data to Supabase
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── vite.config.ts
├── .env.local                # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
└── README.md
```

## Code Conventions

### TypeScript
- Strict mode enabled. No `any` types unless absolutely unavoidable (comment why).
- Use interfaces for data shapes, types for unions/computed types.
- Prefer named exports over default exports.
- File names: PascalCase for components (`FlashCard.tsx`), camelCase for utilities (`quizEngine.ts`).

### React
- Functional components only. No class components.
- Use React hooks for state management. No Redux — keep state in hooks + Supabase.
- Custom hooks prefix with `use` and live in `src/hooks/`.
- Components receive data via props. Data fetching happens in hooks or page components, not in UI components.
- Use React Router v6 for routing.

### Styling
- Tailwind CSS utility classes for all styling. No CSS modules, no styled-components.
- Use shadcn/ui components as base — customize via Tailwind.
- Mobile-first responsive design. All layouts must work on 375px+ screens.
- Color scheme: use CSS variables (shadcn default theming). Support dark mode from day 1.

### Danish Language Handling
- Always support æ, ø, å input. Provide virtual keyboard buttons.
- Answer comparison must be case-insensitive and trim whitespace.
- Accept both "ae"/"oe"/"aa" and "æ"/"ø"/"å" as valid input (configurable).
- Store all Danish text as UTF-8.

### Supabase
- Use Supabase JS client v2.
- All database access through typed queries (generate types with `supabase gen types typescript`).
- Row Level Security (RLS) enabled on all tables. User can only access their own user_cards and review_logs.
- Environment variables: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local`.

### FSRS (Spaced Repetition)
- Use `ts-fsrs` library for all scheduling logic.
- Card state stored in Supabase `user_cards` table, synced after each review.
- FSRS runs client-side — no backend round-trips for scheduling.
- Default desired retention: 0.9 (90%).
- Four ratings: Again (1), Hard (2), Good (3), Easy (4).

## Database Schema

See `supabase/migrations/001_initial_schema.sql` for the full schema. Key tables:

- **words** — Vocabulary with inflections stored as JSONB (varies by POS)
- **grammar_topics** — Grammar explanations, rules, tips, organized by module
- **exercises** — Quiz questions of various types, linked to grammar topics or words
- **sentences** — Danish/English sentence pairs for reading and cloze practice
- **user_cards** — Per-user FSRS card state (due date, stability, difficulty, etc.)
- **review_logs** — History of every review for analytics

### Inflection JSONB Patterns

```typescript
// Noun inflections
{ definite: "bilen", plural_indef: "biler", plural_def: "bilerne" }

// Verb inflections
{ present: "spiser", past: "spiste", perfect: "har spist", imperative: "spis" }

// Adjective inflections
{ t_form: "stort", e_form: "store", comparative: "større", superlative: "størst" }

// Pronoun inflections
{ subject: "jeg", object: "mig", possessive: ["min", "mit", "mine"] }
```

## Module 2 Grammar Topics (MVP Content Scope)

1. **T-ord og N-ord** — Noun gender (en/et), definite/indefinite/plural forms
2. **Komparativ og Superlativ** — Comparative & superlative adjectives
3. **Omvendt Ordstilling** — Inverted word order (V2 rule)
4. **Hovedsætning og Ledsætninger** — Main vs. subordinate clause word order
5. **Verber og Tider** — Verb tenses (nutid, datid, førnutid, førdatid, imperative)
6. **Pronominer** — Personal, possessive, reflexive, demonstrative, relative pronouns

## Exercise Types

| Type | ID | Description |
|------|----|-------------|
| Type answer | `type_answer` | User sees prompt, types Danish/English answer |
| Cloze | `cloze` | Sentence with blank, user types missing word |
| Multiple choice | `multiple_choice` | 4 options, select correct one |
| Word order | `word_order` | Jumbled words, arrange into correct sentence |
| Error correction | `error_correction` | Sentence with grammatical error, user fixes it |
| Matching | `matching` | Match Danish ↔ English pairs |
| Conjugation | `conjugation` | Given verb infinitive, fill in all tense forms |

## Testing

- Use Vitest for unit tests (quiz engine, FSRS wrapper, answer checking).
- Use React Testing Library for component tests.
- Test files co-located: `QuizCard.test.tsx` next to `QuizCard.tsx`.
- At minimum, test: answer comparison logic, FSRS scheduling, quiz scoring.

## Environment Variables

```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

Never commit `.env.local`. The `.env.example` file documents required vars.

## Commands

```bash
npm run dev          # Start dev server (Vite)
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # ESLint
npm run test         # Vitest
npm run types        # Generate Supabase types
```

## Key Design Principles

1. **Exam-focused only** — Every feature and content item must map to an exam topic. No "fun extras" that dilute focus.
2. **Production over recognition** — Type-the-answer is always preferred over multiple choice. Active recall > passive review.
3. **Mobile-ready from day 1** — Responsive design, touch-friendly interactions. Later wraps to native app via Capacitor.
4. **Legally clean content** — Only open-source data, self-generated exercises, or properly licensed content. Never copy textbook text verbatim.
5. **Offline-capable SRS** — FSRS runs client-side. User can review even with slow connections. Sync on reconnect.
