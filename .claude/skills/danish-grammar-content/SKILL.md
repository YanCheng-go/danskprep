---
name: danish-grammar-content
description: Reference for generating and reviewing Danish exam content
user-invocable: true
---

# Danish Grammar Content Reference

Reference for generating and reviewing Danish exam content.

> **Reference:** Read `.claude/references/danish-content.md` first — it covers character encoding, grammatical accuracy rules, exam scope, exercise quality, and legal compliance.

## Exam levels (for tagging content)
| Level | Code | Difficulty | Notes |
|-------|------|-----------|-------|
| Module 2 | `module_level: 2` | A2 | **MVP scope** |
| PD2 | `module_level: 2` | A2/B1 | Same content range |
| PD3 Module 1 | `module_level: 3` | B1+ | `--exam PD3M1` |
| PD3 Module 2 | `module_level: 3` | B2 | `--exam PD3M2` — primary scrape target |

## Module 2 grammar topics — detailed reference

### 1. T-ord og N-ord (slug: `noun-gender`)
Definite forms: en-word adds `-en` (bilen), et-word adds `-et` (huset). If word ends in unstressed `-e`, add just `-n`/`-t` (lampen, tæppet).

| Form | En-word | Et-word |
|------|---------|---------|
| Indef. sg. | en bil | et hus |
| Def. sg. | bilen | huset |
| Indef. pl. | biler | huse |
| Def. pl. | bilerne | husene |

Patterns: people/animals → usually en. Countries/languages → usually et. Endings -hed/-else/-tion/-itet → en.

### 2. Komparativ og Superlativ (slug: `comparative`)
Regular: `stor → større → størst`, `lang → længere → længst`, `smuk → smukkere → smukkest`
Multi-syllable: `interessant → mere interessant → mest interessant`
Irregular: `god/bedre/bedst`, `dårlig/værre/værst`, `lille/mindre/mindst`, `gammel/ældre/ældst`, `ung/yngre/yngst`, `mange/flere/flest`, `meget/mere/mest`
Agreement: `-t` form for et-noun indefinite; `-e` form for definite and plural.

### 3. Omvendt Ordstilling (slug: `word-order`)
V2 rule: verb always 2nd in main clause. When time/place/subordinate clause leads → verb before subject.
```
Normal:   Jeg spiser morgenmad.
Inverted: I morges spiste jeg morgenmad.
          Hvis det regner, tager jeg en paraply.
```

### 4. Hovedsætning og Ledsætninger (slug: `clause-structure`)
Main clause (SVAO): `Han spiser ikke morgenmad.` (ikke AFTER verb)
Subordinate clause (CSAVO): `...fordi han ikke spiser morgenmad.` (ikke BEFORE verb)

Subordinating conjunctions: `at, fordi, hvis, når, da, selvom, mens, inden, efter at, medmindre`
Coordinating (no inversion): `og, men, eller, for, så`

### 5. Verber og Tider (slug: `verb-tenses`)
Group 1 (-ede): `snakke → snakker → snakkede → har snakket`
Group 2 (-te): `spise → spiser → spiste → har spist`
Irregular (must memorize): `gå/går/gik/gået`, `komme/kommer/kom/kommet`, `se/ser/så/set`, `tage/tager/tog/taget`, `give/giver/gav/givet`, `drikke/drikker/drak/drukket`, `skrive/skriver/skrev/skrevet`, `sige/siger/sagde/sagt`

### 6. Pronominer (slug: `pronouns`)
Subject/Object: jeg/mig, du/dig, han/ham, hun/hende, vi/os, I/jer, de/dem, den/den, det/det
Possessive: min/mit/mine, din/dit/dine, **sin/sit/sine** (subject's own), hans/hendes/dets/dens (someone else's), vores, jeres, deres
`sin` rule: `Peter vasker sin bil` (his own) vs `Peter vasker hans bil` (someone else's)
Reflexive: mig, dig, **sig**, os, jer, sig

## Top 10 common mistakes (prioritize exercises for these)
1. Wrong noun gender (en/et confusion)
2. `ikke` placement in subordinate clauses (must be BEFORE verb)
3. Forgetting inversion after initial adverb/clause
4. Mixing up `sin/sit/sine` vs `hans/hendes`
5. Wrong past tense for irregular verbs
6. Using `mere/mest` with short adjectives that take `-ere/-est`
7. Forgetting `-t`/`-e` adjective agreement
8. Confusing `når` (repeated/future) vs `da` (past single event)
9. Wrong word order in questions
10. Wrong pronoun case (subject vs object)
