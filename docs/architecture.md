# Project Architecture

Detailed directory structure for DanskPrep.

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
│   │   ├── welcome/          # FloatingWords, WordBubble, BubbleLeaderboard, GamePanel
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
├── docs/                     # Architecture docs, reports, plans
│   ├── data-pipeline.md      # Full content pipeline documentation
│   ├── games.md              # Bubble Word Game design
│   ├── backlog.md            # Backlog overview
│   ├── plans/                # Implementation plans
│   ├── pm/                   # PM agent output
│   ├── reviews/              # Project review reports
│   ├── some/                 # Social media posts
│   ├── spikes/               # Technical research spikes
│   └── test-reports/         # Frontend test reports
├── .claude/
│   ├── agents/               # Agent definitions (pm, coder, data-engineer, etc.)
│   ├── skills/               # Skill definitions (backlog, commit, daily, release, etc.)
│   ├── rules/                # Auto-loaded conventions and checks
│   └── references/           # Domain knowledge loaded by skills on demand
└── references/               # External data source documentation
```

## Key Directories

### `src/components/`

Components organized by domain. Each subdirectory contains related components that share a feature area. Components are functional, use named exports, and follow the conventions in `.claude/rules/react-conventions.md`.

### `src/lib/`

Core logic that is not React-specific:
- **`fsrs.ts`** — FSRS spaced repetition scheduling
- **`answer-check.ts`** — Damerau-Levenshtein answer comparison with Danish normalization
- **`danish-input.ts`** — Virtual keyboard character insertion (æ, ø, å)
- **`quiz-engine.ts`** — Quiz session management and exercise selection
- **`supabase.ts`** — Supabase client initialization
- **`i18n.ts`** — Internationalization (EN/DA)

### `src/data/seed/`

Bundled JSON files that the app loads at startup. Currently the primary data source (BL-043 will migrate to runtime Supabase fetch).

| File | Content |
|------|---------|
| `exercises-pd3m2.json` | 933 exercises across 7 types |
| `words-pd3m2.json` | 595 words with inflection tables |
| `grammar-pd3m2.json` | 6 grammar topics |
| `writing-prompts-pd3m2.json` | 14 writing prompts |
| `speaking-prompts-pd3m2.json` | 11 speaking prompts |
| `listening-episodes.json` | 8 podcast episodes |
| `sentences-pd3m2.json` | Danish/English sentence pairs |
| `changelog.json` | App changelog entries |

### `scripts/`

Python tooling for the content pipeline. See [data-pipeline.md](data-pipeline.md) for the full flow.

### `supabase/migrations/`

SQL migration files (001–008) applied via Supabase CLI. See `.claude/rules/supabase-workflow.md` for the migration workflow.
