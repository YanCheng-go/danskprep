---
globs:
  - "src/data/seed/**/*.json"
  - "supabase/seed.sql"
  - "scripts/**/*.py"
---

# Danish Content Standards

## Character Encoding
- All Danish text stored as UTF-8 — use æ, ø, å directly (never ae, oe, aa in stored data)
- Input normalisation (ae→æ etc.) happens at runtime in `src/lib/danish-input.ts`, not at storage time
- JSON files must be saved as UTF-8 without BOM

## Grammatical Accuracy — Non-Negotiables
- **V2 rule**: verb is always in second position in Danish main clauses
- **Negation placement**: "ikke" after verb in main clause (`Han spiser ikke`), before verb in subordinate clause (`fordi han ikke spiser`)
- **Definite article suffixes**: en-words add `-en` (bilen), et-words add `-et` (huset), but if word ends in unstressed `-e`, add just `-n` or `-t`
- **Adjective inflection**: t-form for et-nouns indefinite, e-form for en-nouns definite and all plurals
- **Pronoun case**: subject forms (jeg, du, han, hun, vi, I, de) vs object forms (mig, dig, ham, hende, os, jer, dem)
- **Reflexive**: use `sig` (not `ham/hende`) when subject and object are the same person

## Exam Scope
- **Module 2 only in MVP** — do not add content that belongs to Module 3+ unless tagged accordingly
- Every exercise must map to one of the 6 Module 2 grammar topics:
  1. T-ord og N-ord
  2. Komparativ og Superlativ
  3. Omvendt Ordstilling
  4. Hovedsætning og Ledsætninger
  5. Verber og Tider
  6. Pronominer
- Vocabulary should consist of words plausibly seen in Module 2 exam materials

## Exercise Quality
- **Cloze blanks**: exactly one blank per sentence; the blank must have an unambiguous correct answer
- **Multiple choice distractors**: must be the same part of speech and plausible enough to require knowledge to reject
- **Word order exercises**: scrambled words must be reassemblable into exactly one correct sentence
- **Error correction**: exactly one error per sentence; error must be grammatical, not spelling/punctuation

## Legal Compliance
- Do not copy sentences verbatim from published textbooks (Undervejs, Basisgrammatik, etc.)
- Generated sentences must be original — inspired by grammar rules, not copied from sources
- Mark `source` field: `"generated"` for AI-generated, `"manual"` for hand-written, `"open_source"` with URL for imported data
