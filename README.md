# DanskPrep

**Danish exam preparation app — currently targeting the Module 2 (Prøve i Dansk 2) test.**

Active recall, spaced repetition (FSRS), and exam-focused exercises for learners preparing for the Danish integration language tests (Prøve i Dansk / Studieprøven).

🌐 **Live app:** [danskprep.vercel.app](https://danskprep.vercel.app)

## Stack

React 18 · TypeScript (strict) · Tailwind CSS v3 · shadcn/ui · ts-fsrs · Supabase · Vercel

## Getting Started

1. Copy `.env.example` to `.env.local` and fill in your Supabase project URL and anon key
2. Run the schema migration in your Supabase project (`supabase/migrations/001_initial_schema.sql`)
3. Install and start:

```bash
npm install
npm run dev
```

The app runs with local seed data immediately — no database seeding required to try it out.

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (Vite, port 5173) |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run test` | Run Vitest unit tests |
| `npm run lint` | ESLint |
| `npm run types` | Generate Supabase TypeScript types |

## Analytics

Usage data is collected via Vercel Analytics and Speed Insights (enabled in production). View the dashboard at:

**[vercel.com/dashboard](https://vercel.com/dashboard)** → DanskPrep → Analytics

The chart below reflects unique visitors over the last 30 days. Update the badge URL once the project is deployed:

![Visitors](https://img.shields.io/badge/visitors-live%20on%20Vercel-brightgreen)

> To add a real visitor count badge: connect [hits.sh](https://hits.sh) or [shield.io](https://shields.io) to your deployment URL once live.

## Data Enrichment

Scrape real exam content from your personal accounts to enrich the exercise database:

```bash
# Install Playwright (one-time)
pip install playwright && playwright install chromium

# Scrape your assignments from SpeakSpeak (Moodle)
SPEAKSPEAK_USER=you@email.com SPEAKSPEAK_PASS=secret \
  python scripts/scrape-speakspeak.py --module 2

# Scrape mock tests from Gyldendal Modultest
GYLDENDAL_USER=you@email.com GYLDENDAL_PASS=secret \
  python scripts/scrape-gyldendal.py --module 2
```

Output is appended to `src/data/seed/exercises-module{N}.json`.

## Roadmap

### ✅ Module 2 — MVP Complete
- [x] Full app (study queue, quiz, grammar reference, vocabulary, progress)
- [x] FSRS spaced repetition (client-side, offline-capable)
- [x] Module 2 seed data (words, grammar topics, exercises, sentences)
- [x] Dark mode + mobile-first responsive design
- [x] Danish character input (æ, ø, å) with typo tolerance
- [x] Vercel Analytics + Speed Insights
- [x] Lazy-loaded routes (reduced initial bundle)

### 🔜 Module 2 — Enrichment
- [ ] Connect Supabase (`.env.local` + migration)
- [ ] Enrich exercises via SpeakSpeak & Gyldendal scrapers
- [ ] Keyboard shortcuts for card ratings (1–4)
- [ ] `useProgress` refresh after study session
- [ ] Supabase sync retry queue (localStorage write-behind)
- [ ] Deploy to Vercel

### 📅 Module 3
- [ ] Module 3 seed data (grammar, words, exercises)
- [ ] Grammar topic detail pages for Module 3 topics
- [ ] Quiz filter by module

### 📅 Module 4 / PD1 / PD2 / Studieprøven
- [ ] Extended vocabulary (~1000+ words per module)
- [ ] Reading comprehension exercise type
- [ ] Listening comprehension integration
- [ ] Progress tracking across modules

### 📅 Long-term
- [ ] Native mobile app (Capacitor)
- [ ] Offline-first sync queue with retry
- [ ] Teacher / admin dashboard
- [ ] Streak notifications and reminders

## Content Scope

| Module | Status | Grammar Topics |
|--------|--------|----------------|
| Module 2 | ✅ MVP | Noun gender, Comparatives, Inverted word order, Main/subordinate clauses, Verb tenses, Pronouns |
| Module 3 | 📅 Planned | — |
| Module 4 | 📅 Planned | — |
| PD1 / PD2 | 📅 Planned | — |
| Studieprøven | 📅 Planned | — |

## License

MIT
