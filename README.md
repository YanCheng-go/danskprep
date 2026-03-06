# DanskPrep

**Danish exam preparation app — currently targeting PD3 Module 2 (Prøve i Dansk 3).**

Active recall, spaced repetition (FSRS), and exam-focused exercises for learners preparing for the Danish integration language tests (Prøve i Dansk / Studieprøven).

**Live app:** [danskprep.vercel.app/welcome](https://danskprep.vercel.app/welcome)
**GitHub:** [github.com/YanCheng-go/danskprep](https://github.com/YanCheng-go/danskprep)

## Features

- **Study** — FSRS spaced repetition with flashcards (client-side, offline-capable)
- **Quiz** — 933 exercises across 7 types (cloze, multiple choice, word order, error correction, conjugation, type answer, matching)
- **Vocabulary Drill** — bidirectional translation, context cloze, paradigm fill, form choice
- **Grammar** — 6 topic reference pages with rules, examples, and practice links
- **Vocabulary** — 595 words with inflection tables, search and filter
- **Writing** — exam-style prompts with AI scoring
- **Speaking** — record, self-transcribe, AI grammar feedback
- **Listening** — podcast episodes with comprehension quizzes and vocabulary highlights
- **Progress** — stats dashboard, streak tracking, accuracy metrics
- **i18n** — English/Danish UI toggle (flag button in header)
- **Danish Tutor** — AI chatbot for grammar questions and conversation practice
- **Bubble Word Game** — floating Danish words to discover, with leaderboard rankings, clickable resume, and session persistence for signed-in users (see [docs/games.md](docs/games.md))
- **Dark mode** — persistent theme toggle

## Content

| Dataset | Count |
|---------|-------|
| Exercises | 933 |
| Vocabulary | 595 |
| Grammar topics | 6 |
| Writing prompts | 14 |
| Speaking prompts | 11 |
| Listening episodes | 8 |

## Quick Start

```bash
cp .env.example .env.local   # add Supabase URL + anon key
npm install
npm run dev
```

See [DEVELOPMENT.md](DEVELOPMENT.md) for setup, commands, workflow, and the full agent/skill ecosystem.

## Roadmap

### Done
- [x] Full app: study, quiz, drill, grammar, vocabulary, writing, speaking, listening, progress
- [x] FSRS spaced repetition (client-side, offline-capable)
- [x] PD3 Module 2 seed data (933 exercises, 595 words)
- [x] Dark mode + mobile-first responsive design
- [x] Danish character input with typo tolerance (Damerau-Levenshtein)
- [x] Vercel Analytics + Speed Insights
- [x] Lazy-loaded routes
- [x] AI chatbot tutor
- [x] EN/DA language toggle (browser language auto-detection)
- [x] In-app feedback system
- [x] Supabase migrations 001-008 applied via CLI
- [x] Nix + direnv dev environment
- [x] Fill verb inflections (595 words, 222 verbs with complete conjugations)

### Next
- [ ] Fetch content from Supabase at runtime (BL-043)
- [ ] Stable exercise IDs (BL-041)
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

[CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/) — free to share and adapt for non-commercial use with attribution.
