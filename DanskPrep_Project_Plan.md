# DanskPrep — Danish Exam Preparation App

## Project Plan & Technical Roadmap

---

## 1. Vision & Scope

**DanskPrep** is an exam-focused Danish language learning app. The scope is strictly what gets tested in the Danish exams: grammar, vocabulary, reading, writing, and listening — not general language learning.

**Starting point:** Module 2 test (in 2 weeks), then PD3 (Prøve i Dansk 3, B2 level)
**Extensible to:** Module 1–5, PD1, PD2, PD3, Studieprøven

**Target users:**
- Immigrants/expats in Denmark preparing for official language exams
- Language school students (DU3 pathway)
- Self-learners targeting specific module tests or PD exams

---

## 2. Module 2 Grammar Topics (MVP Content)

### 2.1 T-ord og N-ord (Noun Gender)
- En-words (common gender / n-ord) vs. Et-words (neuter gender / t-ord)
- Definite/indefinite forms: en bil → bilen, et hus → huset
- Plural forms: biler → bilerne, huse → husene
- Rules of thumb and common exceptions
- Practice: given a noun, identify gender and produce all 4 forms

### 2.2 Komparativ og Superlativ (Comparative & Superlative)
- Regular: -ere / -est (stor → større → størst)
- With "mere/mest": mere interessant → mest interessant
- Irregular forms: god → bedre → bedst, dårlig → værre → værst
- Adjective agreement with noun gender: den store bil, det store hus
- Practice: given adjective, produce comparative + superlative

### 2.3 Omvendt Ordstilling (Inverted Word Order)
- V2 rule: verb always in second position
- When adverb/time expression comes first: "I morges gik jeg..."
- When subordinate clause comes first: "Hvis det regner, tager jeg..."
- Questions: "Hvad laver du?"
- Practice: reorder sentences, identify correct word order

### 2.4 Hovedsætning og Ledsætninger (Main & Subordinate Clauses)
- Main clause word order: Subject – Verb – (Adverb) – Object
- Subordinate clause word order: Conjunction – Subject – (Adverb) – Verb – Object
- Common conjunctions: at, fordi, hvis, når, selvom, da, mens, så
- Adverb placement: "Han spiser ikke" (main) vs. "...fordi han ikke spiser" (sub)
- Practice: combine clauses, fix word order errors

### 2.5 Verber og Tider (Verbs & Tenses)
- Present (nutid): spiser, bor, læser
- Past (datid): spiste, boede, læste
- Present perfect (førnutid): har spist, har boet, har læst
- Past perfect (førdatid): havde spist, havde boet
- Future: vil + infinitive, skal + infinitive
- Imperative (bydeform): spis!, bo!, læs!
- Regular vs. irregular verb groups
- Practice: conjugation tables, fill-in-the-blank tense exercises

### 2.6 Pronominer (Pronouns)
- Personal pronouns: jeg/mig, du/dig, han/ham, hun/hende, den/det, vi/os, I/jer, de/dem
- Possessive pronouns: min/mit/mine, din/dit/dine, sin/sit/sine, hans, hendes, vores, jeres, deres
- Reflexive pronouns: mig, dig, sig, os, jer, sig
- Demonstrative: denne/dette/disse, den/det/de
- Relative: som, der, hvilken/hvilket/hvilke
- Practice: fill-in pronoun, choose correct form

---

## 3. Learning Science — What the App Must Implement

### 3.1 Core Techniques (Evidence-Based)

| Technique | Priority | Evidence |
|-----------|----------|----------|
| **Spaced repetition (FSRS)** | #1 | Dunlosky 2013: one of only two "high utility" learning techniques |
| **Active recall (type answer)** | #2 | Roediger & Karpicke 2006: retrieval practice beats re-reading by 2-3x |
| **Handwriting/typing production** | #3 | van der Meer 2023: handwriting activates broader neural networks for memory |
| **Cloze deletion** | #4 | Effective for grammar pattern acquisition |
| **Interleaved practice** | #5 | Mixing topics prevents illusion of mastery |
| **Multiple choice** | #6 | Useful for quick review, weaker for long-term retention |

### 3.2 Exercise Types (Ranked by Effectiveness)

1. **Type-the-answer** — See Danish, type English (or vice versa). Forces production.
2. **Conjugation table** — Given verb infinitive, fill in all tense forms by typing.
3. **Cloze deletion** — "Han ___ (spise) morgenmad hver dag." → spiser
4. **Sentence construction** — Given jumbled words, drag/type correct Danish word order.
5. **Error correction** — "Fordi han spiser ikke..." → "Fordi han ikke spiser..."
6. **Translation** — Type full Danish sentence from English prompt.
7. **Multiple choice** — Fastest to implement, good for initial exposure.
8. **Matching pairs** — Connect Danish ↔ English, drag and drop.

### 3.3 FSRS Algorithm

Use **Free Spaced Repetition Scheduler** (FSRS) — state-of-the-art, open source.
- Python: `py-fsrs` (pip install fsrs)
- TypeScript: `ts-fsrs` (npm install ts-fsrs)
- 4 ratings: Again (1), Hard (2), Good (3), Easy (4)
- Tracks: difficulty, stability, retrievability per card
- Schedules next review based on desired retention (default 90%)

---

## 4. Tech Stack

### 4.1 Architecture

```
┌─────────────────────┐     ┌──────────────────┐
│   React Frontend    │────→│  Supabase Backend │
│   (Vite + TS)       │     │  (PostgreSQL)     │
│                     │     │  + Auth            │
│  - Study interface  │     │  + Edge Functions  │
│  - Quiz engine      │     │  + REST API        │
│  - Progress UI      │     │                    │
│  - FSRS (ts-fsrs)   │     │  Static data:      │
└─────────────────────┘     │  - Words table     │
                            │  - Grammar table   │
                            │  - Sentences table  │
                            │                    │
                            │  User data:         │
                            │  - Progress table   │
                            │  - Review logs      │
                            └──────────────────┘
```

### 4.2 Stack Choices

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Frontend | React + Vite + TypeScript | Easy mobile conversion (Capacitor/Expo). Fast dev. |
| UI Framework | Tailwind CSS + shadcn/ui | Clean, accessible, responsive |
| SRS Engine | ts-fsrs (client-side) | No backend calls needed for scheduling |
| Backend/DB | Supabase (free tier) | PostgreSQL + Auth + API. Zero config. |
| Hosting | Vercel (free tier) | Auto-deploy from Git. |
| Content Gen | Claude API (optional) | Generate sentences, explanations (Phase 2) |
| Mobile (later) | Capacitor or React Native | Wrap web app for iOS/Android |

### 4.3 Database Schema

```sql
-- Words: core vocabulary with all inflections
CREATE TABLE words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  danish TEXT NOT NULL,              -- base form (infinitive for verbs, indefinite for nouns)
  english TEXT NOT NULL,             -- English translation
  part_of_speech TEXT NOT NULL,      -- 'noun', 'verb', 'adjective', 'adverb', 'pronoun', 'conjunction', 'preposition'
  gender TEXT,                       -- 'en', 'et', NULL (for non-nouns)
  module_level INT NOT NULL,         -- 1-5 (which module this word appears in)
  difficulty INT DEFAULT 1,          -- 1=easy, 2=medium, 3=hard
  tags TEXT[],                       -- ['daily', 'exam_common', 'irregular']
  inflections JSONB,                 -- flexible: varies by POS (see below)
  example_da TEXT,                   -- example sentence in Danish
  example_en TEXT,                   -- example sentence in English
  audio_url TEXT,                    -- pronunciation (future)
  notes TEXT,                        -- additional learning notes
  source TEXT,                       -- where this data came from
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Inflection JSONB examples:
-- Noun: {"definite": "bilen", "plural_indef": "biler", "plural_def": "bilerne"}
-- Verb: {"present": "spiser", "past": "spiste", "perfect": "har spist", "imperative": "spis"}
-- Adjective: {"t_form": "stort", "e_form": "store", "comparative": "større", "superlative": "størst"}
-- Pronoun: {"subject": "jeg", "object": "mig", "possessive": ["min", "mit", "mine"]}

-- Grammar topics
CREATE TABLE grammar_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,               -- 'Inverted Word Order'
  slug TEXT UNIQUE NOT NULL,         -- 'inverted-word-order'
  module_level INT NOT NULL,
  category TEXT NOT NULL,            -- 'word_order', 'verbs', 'nouns', 'adjectives', 'pronouns', 'clauses'
  explanation TEXT NOT NULL,          -- Full explanation in English
  rules JSONB,                       -- Structured rules: [{"rule": "...", "example_da": "...", "example_en": "..."}]
  tips TEXT[],                       -- Memory tips, mnemonics
  common_mistakes TEXT[],            -- "Don't confuse sin/hans when..."
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Exercises / quiz questions
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grammar_topic_id UUID REFERENCES grammar_topics(id),
  word_id UUID REFERENCES words(id),  -- NULL if grammar-only exercise
  exercise_type TEXT NOT NULL,        -- 'type_answer', 'cloze', 'multiple_choice', 'word_order', 'error_correction', 'matching'
  question TEXT NOT NULL,             -- the prompt shown to user
  correct_answer TEXT NOT NULL,       -- the expected answer
  alternatives TEXT[],               -- for multiple choice: wrong answers
  hint TEXT,                         -- optional hint
  explanation TEXT,                   -- shown after answering
  module_level INT NOT NULL,
  difficulty INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Sentences for reading/cloze practice
CREATE TABLE sentences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  danish TEXT NOT NULL,
  english TEXT NOT NULL,
  module_level INT NOT NULL,
  topic_tags TEXT[],                  -- ['word_order', 'present_tense', 'subordinate_clause']
  difficulty INT DEFAULT 1,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User progress (FSRS card states)
CREATE TABLE user_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,             -- Supabase auth user
  card_type TEXT NOT NULL,           -- 'word', 'exercise', 'grammar'
  card_ref_id UUID NOT NULL,         -- references words.id, exercises.id, etc.
  -- FSRS fields
  state INT DEFAULT 0,               -- 0=New, 1=Learning, 2=Review, 3=Relearning
  difficulty FLOAT DEFAULT 0,
  stability FLOAT DEFAULT 0,
  retrievability FLOAT DEFAULT 0,
  due TIMESTAMPTZ DEFAULT now(),
  last_review TIMESTAMPTZ,
  reps INT DEFAULT 0,
  lapses INT DEFAULT 0,
  -- stats
  correct_count INT DEFAULT 0,
  incorrect_count INT DEFAULT 0,
  streak INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, card_type, card_ref_id)
);

-- Review history
CREATE TABLE review_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_card_id UUID REFERENCES user_cards(id),
  user_id UUID NOT NULL,
  rating INT NOT NULL,                -- 1=Again, 2=Hard, 3=Good, 4=Easy
  response TEXT,                      -- what the user typed
  was_correct BOOLEAN,
  time_taken_ms INT,                  -- how long they took
  reviewed_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 5. Data Sources (Legally Safe)

### 5.1 Free & Open Source (use for MVP)

| Source | What it provides | License |
|--------|-----------------|---------|
| **dansk-api-ordbog** (GitHub) | Danish words with inflections & word classes | Open source |
| **Det Centrale Ordregister (COR)** | 516,017 word forms | Check license |
| **Wikidata Lexemes** | 81,000+ Danish lexemes with metadata | CC0 |
| **DSDO word list** | Danish word list (Debian: `aspell-da`) | GPL |
| **IATE** | 500,000+ Danish terms (EU terminology) | Open |
| **awesome-danish** (GitHub) | Curated list of all Danish NLP resources | MIT |
| **Your own generated content** | Claude-generated sentences, exercises | You own it |

### 5.2 Textbook Content — Legal Approach

**DO NOT:**
- Copy paragraphs, exercises, or page layouts from textbooks
- Scan and OCR textbook pages for redistribution
- Reproduce publisher's selection/arrangement of content

**DO (Legally Safe):**
- Extract individual vocabulary words (single words are not copyrightable)
- Note which grammar topics appear in which module
- Create ORIGINAL example sentences inspired by the same topics
- Use Claude API to generate new exercises covering the same grammar rules
- Reference textbook by name ("Covers vocabulary from Chapter 3 of [book]")

### 5.3 Content Pipeline for MVP

```
Step 1: Seed words table from dansk-api-ordbog + Wikidata
        → Import ~2000 most common words with inflections
        
Step 2: Tag words by module level
        → You manually tag which words appear in Module 2 textbook
        
Step 3: Generate exercises with Claude
        → Feed grammar rules + word list to Claude API
        → Output: cloze, multiple choice, word order exercises
        → Human review → insert into exercises table

Step 4: Write grammar explanations
        → Combine your class notes + Claude-assisted writing
        → Original content, no copyright issues
```

### 5.4 User-Contributed Content (Phase 2)

**Contribution flow:**
```
User pastes text (article, textbook paragraph, word list)
  ↓
Claude API extracts structured data:
  - Individual words + POS + translation
  - Identified grammar patterns
  - Generated example sentences (ORIGINAL, not copied)
  ↓
User reviews & confirms extracted data
  ↓
Submitted to shared pool with:
  - User attribution
  - Source tag (but source text is NOT stored)
  - Auto-quality score
  ↓
Community voting + LLM verification
```

**Key legal protection:** The app stores only the *extracted structured data* (word, translation, POS), not the original copyrighted text. This is transformative use.

---

## 6. Security & Legal Considerations

### 6.1 GDPR Compliance (Required in Denmark/EU)

- [ ] Privacy policy explaining data collection
- [ ] Explicit consent for account creation
- [ ] User can export their data (Supabase makes this easy)
- [ ] User can delete account and all data
- [ ] Minimal data collection (email + progress only)
- [ ] No third-party tracking in MVP

### 6.2 API Security

- [ ] Never expose API keys in frontend
- [ ] Use Supabase Row Level Security (RLS)
- [ ] Rate limiting on auth endpoints
- [ ] Input sanitization on user-generated content

### 6.3 Copyright

- [ ] All content either: open-source licensed, self-generated, or transformatively extracted
- [ ] No textbook content stored verbatim
- [ ] User-contributed content pipeline strips source text
- [ ] Terms of service: users warrant they have right to share contributed content

---

## 7. MVP Features (2-Week Sprint)

### Week 1: Core Infrastructure + Data

**Day 1-2: Project Setup**
- [ ] Initialize React + Vite + TypeScript project
- [ ] Set up Supabase project (free tier)
- [ ] Create database tables (schema above)
- [ ] Set up authentication (email + password)
- [ ] Basic app shell with routing

**Day 3-4: Seed Data**
- [ ] Import Module 2 vocabulary (~300 words) with inflections
- [ ] Write grammar topic explanations (6 topics)
- [ ] Create initial exercise set (~200 exercises across all types)
- [ ] Import common sentences tagged by grammar topic

**Day 5: Grammar Reference**
- [ ] Grammar topics list page
- [ ] Individual topic detail view with rules, examples, tips
- [ ] Navigation between related topics

### Week 2: Study Features + Polish

**Day 6-7: Flashcard System**
- [ ] Flashcard component with flip animation
- [ ] FSRS integration (ts-fsrs) for scheduling
- [ ] Daily review queue ("Today's cards")
- [ ] Rating buttons: Again / Hard / Good / Easy

**Day 8-9: Quiz Modes**
- [ ] Type-the-answer quiz (with Danish keyboard support: æ, ø, å)
- [ ] Multiple choice quiz
- [ ] Cloze deletion quiz
- [ ] Word order exercise (drag-and-drop or type)
- [ ] Immediate feedback + explanation

**Day 10: Dashboard + Progress**
- [ ] Dashboard: cards due today, streak, accuracy stats
- [ ] Progress per grammar topic (mastered / learning / new)
- [ ] Review history
- [ ] Settings: daily card limit, notification preferences

**Day 11-12: Polish**
- [ ] Responsive design (works on phone browser)
- [ ] Error handling + loading states
- [ ] Danish keyboard input helper (virtual keys for æ, ø, å)
- [ ] Deploy to Vercel

---

## 8. Post-MVP Roadmap

### Phase 2: Content Expansion (Month 2)
- Modules 1, 3, 4, 5 content
- User-contributed content pipeline with LLM extraction
- Audio pronunciation (browser TTS or recorded)
- More exercise types: error correction, translation, listening
- Import from open-source Danish data sources

### Phase 3: Gamification & Engagement (Month 3)
- Daily streak + XP system
- Skill tree organized by exam sections
- Timed challenge mode (exam pressure simulation)
- Leaderboards (opt-in, among study groups)
- Achievement badges

### Phase 4: Exam Simulation (Month 4)
- Full PD3 practice test (reading + writing sections)
- Timed test mode matching real exam format
- Score prediction based on progress data
- AI tutor chat: ask grammar questions, get contextual explanations

### Phase 5: Mobile App (Month 5-6)
- Wrap React app with Capacitor for iOS + Android
- Offline mode for flashcard reviews
- Push notification reminders
- App Store / Google Play submission

### Phase 6: Monetization & Scale (Month 6-12)
- **Freemium model:**
  - Free: basic flashcards, limited daily reviews, Module 2 content
  - Paid ($5-10/month): all modules, exam simulation, AI tutor, unlimited reviews
- Expand to PD1, PD2, Studieprøven content
- B2B: sell to Danish language schools as supplementary tool
- Teacher dashboard: track student progress
- Consider Norwegian/Swedish expansion (similar grammar)

---

## 9. File & Folder Structure (MVP)

```
danskprep/
├── public/
├── src/
│   ├── components/
│   │   ├── layout/          # Header, Sidebar, Footer
│   │   ├── study/           # Flashcard, QuizCard, TypeAnswer
│   │   ├── grammar/         # TopicList, TopicDetail, RuleCard
│   │   ├── progress/        # Dashboard, StatsChart, StreakCounter
│   │   └── ui/              # Button, Input, Modal (shadcn)
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Study.tsx        # Daily review queue
│   │   ├── Grammar.tsx      # Grammar reference
│   │   ├── Quiz.tsx         # Quiz mode selector + quiz
│   │   ├── Vocabulary.tsx   # Browse all words
│   │   ├── Progress.tsx     # Stats dashboard
│   │   ├── Login.tsx
│   │   └── Settings.tsx
│   ├── lib/
│   │   ├── supabase.ts      # Supabase client
│   │   ├── fsrs.ts          # FSRS wrapper
│   │   ├── quiz-engine.ts   # Quiz logic, scoring, feedback
│   │   └── danish-input.ts  # æøå keyboard helper
│   ├── data/
│   │   ├── seed/            # JSON seed files for initial data
│   │   │   ├── words-module2.json
│   │   │   ├── grammar-module2.json
│   │   │   ├── exercises-module2.json
│   │   │   └── sentences-module2.json
│   │   └── types.ts         # TypeScript interfaces for data models
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useStudy.ts      # FSRS + card management
│   │   └── useQuiz.ts
│   ├── App.tsx
│   └── main.tsx
├── supabase/
│   ├── migrations/          # SQL migrations
│   └── seed.sql             # Initial data
├── scripts/
│   ├── import-words.py      # Import from dansk-api-ordbog
│   ├── generate-exercises.py # Generate exercises via Claude API
│   └── seed-database.py     # Push seed data to Supabase
├── package.json
├── tailwind.config.js
├── vite.config.ts
└── README.md
```

---

## 10. Key Design Decisions

1. **FSRS on client-side (ts-fsrs)**: Avoids backend latency for card scheduling. Card state syncs to Supabase for persistence.

2. **Static seed data for MVP**: No scraping, no API calls at startup. All Module 2 content pre-loaded as JSON, pushed to Supabase via seed script.

3. **Type-the-answer as primary mode**: Research shows production > recognition. Multiple choice is secondary.

4. **Exam-focused content only**: Every card and exercise maps to a specific exam topic. No "fun vocabulary" that won't appear on the test.

5. **Progressive disclosure**: Start with flashcards (simple), unlock quiz modes as user progresses. Don't overwhelm new users.

6. **Danish keyboard helper**: Virtual buttons for æ, ø, å on every text input. Critical for non-Danish keyboard users.

---

*Document created: March 2026*
*Status: Ready to build MVP*
