# Add Word

Add a new Danish word to the vocabulary seed data with correct inflections, translations, and metadata.

## Instructions

1. **Gather word info** from the user (or infer from context):
   - Base form (infinitive for verbs, indefinite singular for nouns)
   - Part of speech: noun, verb, adjective, adverb, pronoun, conjunction, preposition
   - English translation
   - Module level (1–5, default: 2)

2. **Generate the inflection JSONB** based on part of speech. See `database-schema.md` for the exact JSON format per POS. Key patterns:
   - Noun (`gender`: "en" or "et"): definite, plural_indef, plural_def
   - Verb: present, past, perfect, imperative
   - Adjective: t_form, e_form, comparative, superlative
   - Pronoun: subject, object, possessive array
   - Adverbs, conjunctions, prepositions: `inflections` is `null`

3. **Create the word entry** following the words JSON format in `database-schema.md`. Required fields: `danish`, `english`, `part_of_speech`, `gender` (nouns only, else null), `module_level`, `difficulty`, `tags`, `inflections`, `example_da`, `example_en`, `source`.

4. **Tag guidelines:**
   - `exam_common` — appears frequently in Module 2 exam exercises
   - `irregular` — irregular inflection pattern
   - `daily` — everyday vocabulary
   - `formal` — formal/written register

5. **Verify Danish accuracy**: Check that inflections follow standard Danish grammar rules. Flag uncertain inflections with a comment.

6. **Append** the entry to `src/data/seed/words-module2.json`. Confirm with the user before writing.
