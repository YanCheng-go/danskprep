# DanskPrep

**Danish exam preparation app — currently targeting PD3 Module 2 (Prøve i Dansk 3).**

Active recall, spaced repetition (FSRS), and exam-focused exercises for learners preparing for the Danish integration language tests (Prøve i Dansk / Studieprøven).

**Live app:** [danskprep.vercel.app](https://danskprep.vercel.app)
**GitHub:** [github.com/YanCheng-go/danskprep](https://github.com/YanCheng-go/danskprep)

## Features

- **Study** — FSRS spaced repetition with flashcards (client-side, offline-capable)
- **Quiz** — 292 exercises across 7 types (cloze, multiple choice, word order, error correction, conjugation, type answer, matching)
- **Vocabulary Drill** — bidirectional translation, context cloze, paradigm fill, form choice
- **Grammar** — 6 topic reference pages with rules, examples, and practice links
- **Vocabulary** — 277 words with inflection tables, search and filter
- **Writing** — exam-style prompts with AI scoring
- **Speaking** — record, self-transcribe, AI grammar feedback
- **Listening** — podcast episodes with comprehension quizzes and vocabulary highlights
- **Progress** — stats dashboard, streak tracking, accuracy metrics
- **i18n** — English/Danish UI toggle (flag button in header)
- **Danish Tutor** — AI chatbot for grammar questions and conversation practice
- **Bubble Word Game** — floating Danish words to discover, with leaderboard rankings, clickable resume, and session persistence for signed-in users (see [docs/games.md](docs/games.md))
- **Dark mode** — persistent theme toggle

## Stack

React 18 · TypeScript (strict) · Vite 6 · Tailwind CSS v3 · shadcn/ui · ts-fsrs · Supabase · Vercel

## Project Structure

```
danskprep/
├── src/
│   ├── components/
│   │   ├── chat/             # AI tutor chatbot (ChatButton, ChatPanel, ChatMessage)
│   │   ├── drill/            # Vocabulary drill rounds (Translation, Cloze, Paradigm, FormChoice)
│   │   ├── exercise/         # Add Exercise dialog
│   │   ├── feedback/         # In-app feedback button + dialog
│   │   ├── grammar/          # TopicList, TopicDetail, RuleCard, ExampleBlock
│   │   ├── layout/           # Header, Sidebar, Layout, PageContainer, AuthGuard
│   │   ├── progress/         # Dashboard, StatsChart, StreakCounter, WhatsNew
│   │   ├── quiz/             # TypeAnswer, MultipleChoice, Cloze, WordOrder, ErrorCorrection
│   │   ├── speaking/         # RecordButton, SpeakingFeedback
│   │   ├── study/            # FlashCard, ReviewQueue, CardRating
│   │   ├── ui/               # shadcn components (Button, Input, Card, Dialog, etc.)
│   │   ├── vocabulary/       # WordList, WordDetail, InflectionTable
│   │   ├── welcome/           # FloatingWords, WordBubble, BubbleLeaderboard, GamePanel
│   │   └── writing/          # WritingPrompt, WritingFeedback
│   ├── data/
│   │   ├── seed/             # JSON seed files (exercises, words, grammar, prompts, episodes)
│   │   └── translations/     # i18n translation files (en.ts, da.ts)
│   ├── hooks/                # Custom React hooks (useAuth, useStudy, useQuiz, useDrill, etc.)
│   ├── lib/                  # Utilities (FSRS, answer-check, AI scoring, chat, i18n, danish-input)
│   ├── pages/                # Route pages (Home, Study, Quiz, Drill, Grammar, Vocabulary, etc.)
│   ├── types/                # TypeScript type definitions
│   └── test/                 # Test setup
├── scripts/                  # Python tooling (scrapers, data enrichment, seeding)
│   └── data/                 # Scraper output artifacts (raw JSON, screenshots)
├── supabase/
│   └── migrations/           # SQL schema migrations (001–008)
├── docs/                     # Architecture diagrams (Excalidraw)
└── references/               # Data source documentation
```

## Getting Started

1. Copy `.env.example` to `.env.local` and fill in your Supabase project URL and anon key
2. Install and start:

```bash
npm install
npm run dev
```

The app runs with local seed data immediately — no database seeding required.

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (Vite, port 5173) |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run test` | Run Vitest unit tests |
| `npm run lint` | ESLint |
| `npm run types` | Generate Supabase TypeScript types |

## Python Scripts

All Python tooling uses **uv** (never pip). Scripts live in `scripts/` with their own `pyproject.toml`.

```bash
# One-time setup
cd scripts
uv venv --python 3.12 .venv
uv sync

# Scrape exercises from SpeakSpeak (requires saved cookies)
uv run python scrape-speakspeak.py --exam PD3M2 --cookies cookies.json

# Enrich vocabulary with AI-generated inflections (requires ANTHROPIC_API_KEY)
uv run python enrich-vocabulary.py
```

## Content

| Dataset | File | Count |
|---------|------|-------|
| Exercises | `exercises-pd3m2.json` | 292 |
| Vocabulary | `words-pd3m2.json` | 277 |
| Grammar topics | `grammar-pd3m2.json` | 6 |
| Writing prompts | `writing-prompts-pd3m2.json` | 10 |
| Speaking prompts | `speaking-prompts-pd3m2.json` | 8 |
| Listening episodes | `listening-episodes.json` | 8 |

## Roadmap

### Done
- [x] Full app: study, quiz, drill, grammar, vocabulary, writing, speaking, listening, progress
- [x] FSRS spaced repetition (client-side, offline-capable)
- [x] PD3 Module 2 seed data
- [x] Dark mode + mobile-first responsive design
- [x] Danish character input with typo tolerance (Damerau-Levenshtein)
- [x] Vercel Analytics + Speed Insights
- [x] Lazy-loaded routes
- [x] AI chatbot tutor
- [x] EN/DA language toggle (browser language auto-detection)
- [x] In-app feedback system
- [x] Supabase migrations 001-008 applied via CLI
- [x] Nix + direnv dev environment (`.envrc` + `flake.nix`)

### Next
- [ ] Generate real DB types (`npm run types` → replace `createClient<any>()`)
- [ ] Seed remote database (`cd scripts && uv run python seed-database.py`)
- [ ] Fill 143 empty verb inflections (run `enrich-vocabulary.py`)
- [ ] Refresh progress stats after study session
- [ ] WordOrder drag-and-drop reorder
- [ ] Lazy-load seed JSON (reduce initial bundle)
- [ ] PD3 Module 1 content
- [ ] Additional mini-games (Word Match, Sentence Builder, Speed Conjugation)
- [ ] PD2 content

### Long-term
- [ ] Native mobile app (Capacitor)
- [ ] Offline-first sync queue
- [ ] Listening exercises from SpeakSpeak
- [ ] Reading comprehension exercises
- [ ] Extended vocabulary (~1000+ words per module)

## License

MIT
