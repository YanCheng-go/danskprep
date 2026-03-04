# Verification Report: generated-all-merged.json

**Date:** 2026-03-04
**File:** `scripts/data/generated-all-merged.json`
**Total exercises:** 513
**Reviewed:** 124 (all 19 error_correction + all 25 word_order + 20 cloze + 20 type_answer + 20 multiple_choice + structural checks on all 513)

## Dataset Summary

| Exercise Type     | Count |
|-------------------|-------|
| cloze             | 223   |
| multiple_choice   | 118   |
| type_answer       | 128   |
| word_order        | 25    |
| error_correction  | 19    |
| **Total**         | **513** |

| Grammar Topic             | Count |
|---------------------------|-------|
| verbs-tenses              | 216   |
| main-subordinate-clauses  | 111   |
| noun-gender               | 61    |
| comparative-superlative   | 57    |
| inverted-word-order       | 48    |
| pronouns                  | 20    |

| Difficulty | Count | Percentage | Target |
|------------|-------|------------|--------|
| 1 (easy)   | 208   | 40.5%      | 40%    |
| 2 (medium) | 227   | 44.2%      | 40%    |
| 3 (hard)   | 78    | 15.2%      | 20%    |

## Structural Checks (all 513) -- PASSED

- All cloze exercises have exactly 1 blank `___`
- All multiple_choice exercises have exactly 3 alternatives
- No correct_answer appears inside its own alternatives array
- No empty correct_answer fields
- All grammar_topic_slug values are valid (match the 6 defined topics)
- No duplicate questions found
- All schema fields present and correctly typed

## Issues Found

### CRITICAL -- Must Fix Before Merge

#### C1. IDX 166 -- MC: "som" is both a distractor AND a valid answer
- **Type:** multiple_choice
- **Question:** `Which sentence uses the correct relative pronoun? 'Jeg har en ven, ___ bor i Århus.'`
- **Correct answer:** `der`
- **Alternatives:** `["som", "hvem", "hvilket"]`
- **Problem:** In Danish, both "der" AND "som" are valid as subject relative pronouns. "som" is listed in `acceptable_answers` but also appears as a distractor in `alternatives`. The quiz engine would display "som" as a wrong option even though it is correct.
- **Fix:** Remove "som" from alternatives. Replace with a different distractor, e.g. `"hvad"`. Or rewrite the question to target the object case where only "som" is valid.

#### C2. IDX 405-409 -- Error correction exercises test reading comprehension, not grammar
- **Type:** error_correction
- **Problem:** These 5 exercises require knowledge of a specific story text to answer. They test whether the learner remembers factual details (e.g., "They live in Middelfart, not Jylland" or "She takes the escalator, not roller skates"), NOT whether the learner can identify a grammatical error. Without the source text, these exercises are unanswerable.
- **IDX 405:** `Find the error: 'Lotte og hendes mor bor i Jylland.'` -- Answer requires knowing they live in Middelfart
- **IDX 406:** `Find the error: 'De cykler til Aalborg.'` -- Answer requires knowing they walk to a bus stop
- **IDX 407:** `Find the error: 'De flyver til København.'` -- Answer requires knowing they take a train
- **IDX 408:** `Find the error: 'Lotte løber på rulleskøjter.'` -- Answer requires knowing she rides an escalator
- **IDX 409:** `Find the error: 'De går en tur med hunden.'` -- Answer requires knowing they walk to an apartment
- **Tagged as:** `main-subordinate-clauses` (incorrect -- no clause grammar is tested)
- **Fix:** Remove these 5 exercises entirely, or replace them with grammar-focused error correction exercises.

### HIGH -- Should Fix

#### H1. IDX 0-4, 328, 339 -- Cloze exercises tagged "verbs-tenses" but testing vocabulary/greetings
- **IDX 0:** Answer "Hvordan" -- a question word, not a verb tense
- **IDX 1:** Answer "Hvad" -- a question word
- **IDX 2:** Answer "godt" -- an adverb
- **IDX 3:** Answer "syg" -- an adjective
- **IDX 4:** Answer "bedring" -- a noun
- **IDX 328:** Answer "godt" -- an adverb (in "Det kan jeg godt forstå")
- **IDX 339:** Answer "Hvad" -- question word (in "Hvad med at...")
- **Problem:** These exercises test vocabulary and fixed expressions, not verb tense conjugation. The `grammar_topic_slug` is misleading for filtering and analytics.
- **Fix:** Either retag with a more appropriate slug or accept that "verbs-tenses" is a catch-all bucket for exercises from the verbs/greetings section of the course material.

#### H2. IDX 8-17 -- Social phrase MC exercises tagged "verbs-tenses"
- 10 multiple_choice exercises testing Danish social phrases (greetings, well-wishes)
- Tagged as `verbs-tenses` but they test cultural/pragmatic knowledge, not grammar
- **Fix:** Ideally these would have a dedicated topic slug like `social-phrases` or `fixed-expressions`. If no new slug is desired, at minimum note this in documentation.

#### H3. IDX 42-47, 342 -- "heller ikke" / "også" exercises tagged "inverted-word-order"
- These cloze exercises test the adverbs "heller ikke" (neither) and "også" (also)
- Tagged as `inverted-word-order` but the grammar point is adverb usage/agreement, not V2 inversion
- **Fix:** Retag or document that the inverted-word-order topic is a broader "adverb placement" bucket.

#### H4. IDX 469-478 -- Adjective agreement exercises tagged "comparative-superlative"
- 10 cloze exercises testing basic adjective agreement (base / -t / -e forms): "hårdt", "nye", "gamle", "kaotiske", "stort", "forskellige", "venlige", "vigtigt", "almindelige", "anderledes"
- None of these test comparative or superlative forms
- The `comparative-superlative` topic already has 40 adjective-agreement exercises (base/-t/-e), 4 actual comparative exercises, and 13 other mixed exercises. The slug is misleading.
- **Fix:** Consider splitting into two topics: `adjective-agreement` and `comparative-superlative`, or rename the slug to `adjective-forms`. At minimum, document this in a topic description.

#### H5. IDX 287-288 -- Near-duplicate error correction exercises
- **IDX 287:** `De siger, at man skal ikke ryge.` -> `at man ikke skal ryge`
- **IDX 288:** `De siger, at man skal ikke stresse.` -> `at man ikke skal stresse`
- Identical grammar pattern, identical error type, identical fix. Only the final verb differs.
- **Fix:** Keep one, replace the other with a different negation placement error (e.g., with `aldrig`, `altid`, or a different clause type).

#### H6. IDX 295-305 -- Word order answers missing terminal punctuation
- 13 word_order exercises (IDX 295-305, 412-413) have answers without a period at the end
- The other 12 word_order exercises (IDX 259-268, 501-502) DO have periods
- Inconsistent punctuation could cause answer-check failures
- **Fix:** Add periods to all 13 answers for consistency: `"På mandag får hun ferie"` -> `"På mandag får hun ferie."`

#### H7. IDX 361-370 -- Geography/factual exercises tagged "noun-gender"
- 10 multiple_choice exercises testing Danish geography facts (Storebæltsbroen, population of Copenhagen, etc.)
- Tagged as `noun-gender` but they test factual knowledge, not gender/inflection
- **Fix:** Retag with an appropriate slug or remove from the grammar exercise pool. These belong in a "Samfundskundskab" (society knowledge) category.

### MEDIUM -- Nice to Fix

#### M1. IDX 49-52 -- Type_answer with English question, Danish metalanguage answer
- **IDX 49:** Q: `What does the Danish conjunction 'men' express?` A: `en modsætning/kontrast`
- **IDX 50:** Q: `What does the Danish conjunction 'eller' express?` A: `et alternativ/anden mulighed`
- **IDX 51-52:** Similar pattern
- **Problem:** The question is in English, but the expected answer is Danish linguistic terminology. A B1-B2 learner might reasonably type "contrast", "a contrast", "opposition", etc. No `acceptable_answers` are provided for English equivalents.
- **Fix:** Add English acceptable_answers: e.g., `["contrast", "a contrast", "opposition"]` for IDX 49.

#### M2. IDX 10 -- Ambiguous social phrase MC
- **Question:** `Din kollega møder med gips om armen. Hvad siger du?`
- **Correct:** `Hvad er der sket?` (What happened?)
- **Distractor:** `God bedring!` (Get well soon)
- Both responses are culturally appropriate when seeing a colleague with a cast. The exercise is technically defensible (asking "What happened?" is the most natural first reaction), but a learner could feel tricked.
- **Fix:** Either add "God bedring!" to `acceptable_answers` or adjust the scenario to make only one response appropriate.

#### M3. Excessive repetition in tror/synes exercises
- 15 exercises (IDX 82-96) all test `tror` vs `synes` distinction with very similar sentence structures
- Good pedagogical coverage of the distinction, but 15 is excessive for one verb pair
- **Fix:** Consider reducing to 8-10 and replacing the rest with other verb distinctions.

#### M4. IDX 326, 329 -- "mange" and "hårdt" tagged comparative-superlative
- These are basic vocabulary/adjective exercises, not comparative or superlative forms
- Part of the broader H4 issue above

#### M5. IDX 503 -- Error correction topic tag is debatable
- **Question:** `Ved du, hvordan skal jeg løse den her opgave?`
- Tagged as `main-subordinate-clauses`
- The error is about word order in an indirect question (subordinate clause), so `main-subordinate-clauses` is actually correct
- The hint says "Check the word order" which triggered the mismatch detector, but the tag is appropriate
- **Verdict:** No fix needed

## Danish Language Correctness

All sampled exercises were reviewed for:
- V2 word order in main clauses
- Correct negation placement in subordinate clauses
- Accurate noun inflections (definite, plural)
- Correct verb conjugations (present, past, past participle, s-passive, imperative)
- Proper use of han/sin/hans reflexive pronouns

**Findings:**

- **Error correction exercises (IDX 282-284, 417-420, 503-506):** All grammar-focused error corrections are linguistically correct. The errors are real, the corrections are accurate, and the explanations clearly state the rule.
- **Word order exercises (IDX 259-268, 295-305, 412-413, 501-502):** All correct Danish sentences. V2 inversion is properly applied. The jumbled words can be rearranged into exactly one valid sentence in each case.
- **S-passive exercises (IDX 145-151):** All s-passive transformations are correct (skrives, drikkes, deles, undgas, hentes, laves, afleveres).
- **Past tense / past participle (IDX 392-404):** All pluperfect (fordatid) constructions are correct (havde + past participle: printet, drukket, glemt, taget, laest, haengt, bestilt, husket, sovet).
- **Noun inflections (IDX 168-186):** All body part inflections are correct, including irregular forms (ojne/ojnene, haender/haenderne, fodder/fodderne, taeer/taeerne).
- **Adjective agreement (sampled from IDX 98-136, 469-478):** All -t/-e forms are correct.
- **Cloze answers:** All sampled answers are unambiguous and correctly fill the blank.

## Overall Quality Assessment

**Strengths:**
- Danish language quality is high -- no spelling errors, correct grammar in all sampled exercises
- Good variety of exercise types and grammar patterns
- Explanations are pedagogically useful -- they state rules, not just answers
- Difficulty distribution is reasonable (40/44/15 vs target 40/40/20)
- Structural integrity is perfect -- no schema violations

**Weaknesses:**
- Topic slug accuracy is the biggest issue: ~30 exercises are mistagged (social phrases as verbs-tenses, geography as noun-gender, adjective agreement as comparative-superlative)
- 5 reading-comprehension exercises masquerading as error_correction (IDX 405-409) are unusable without source text
- 1 multiple_choice exercise (IDX 166) has a valid answer listed as a distractor
- Inconsistent punctuation in word_order answers
- Some exercise clusters are repetitive (15 tror/synes, 2 near-identical subordinate-clause negation)

## Verdict

**NEEDS FIXES before merge.**

The dataset is linguistically sound but has 6 critical/high issues that would cause problems in the quiz engine or confuse learners:

1. **IDX 166** -- remove "som" from alternatives (quiz engine bug)
2. **IDX 405-409** -- remove 5 reading-comprehension exercises (unanswerable without source text)
3. **IDX 295-305, 412-413** -- add terminal punctuation to 13 word_order answers (answer-check consistency)

The remaining high and medium issues (topic slugs, near-duplicates, English/Danish answer format) are quality improvements that can be addressed in a follow-up pass but do not block merging.

**Minimum required fixes: 19 exercises (1 MC fix + 5 removals + 13 punctuation fixes)**
