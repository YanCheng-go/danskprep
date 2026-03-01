# Generate Exercises

Generate a batch of exercises for a Danish grammar topic or vocabulary set, following DanskPrep's exercise type specifications and quality standards.

## Instructions

The user will specify a grammar topic or vocabulary list. Follow these steps:

1. **Identify scope** — Ask for (or infer from context):
   - Grammar topic (e.g., "Omvendt Ordstilling", "Verber og Tider")
   - Exercise types requested (default: cloze, type_answer, multiple_choice, word_order)
   - Module level (default: 2)
   - Number of exercises per type (default: 5)

2. **Generate exercises** in this JSON format matching the `exercises` table schema:
```json
{
  "exercise_type": "cloze",
  "question": "Han ___ (spise) morgenmad hver dag.",
  "correct_answer": "spiser",
  "alternatives": null,
  "hint": "present tense of spise",
  "explanation": "In main clauses, the verb takes present tense ending -er: spiser.",
  "module_level": 2,
  "difficulty": 1
}
```

3. **Exercise type rules:**
   - `type_answer`: Danish prompt → user types English (or vice versa). Single word or short phrase.
   - `cloze`: Sentence with one `___` blank. Include verb in parentheses for conjugation cloze, or leave bare for word choice cloze.
   - `multiple_choice`: Include exactly 3 plausible `alternatives` (wrong answers). Distractors must be grammatically similar to the correct answer.
   - `word_order`: `question` is a scrambled list of words separated by `/`. `correct_answer` is the correct sentence.
   - `error_correction`: `question` contains a sentence with one grammatical error. `correct_answer` is the fixed sentence.

4. **Content standards:**
   - Use everyday Danish vocabulary (Module 2 level). Avoid obscure words.
   - Sentences must be grammatically correct except in `error_correction` type.
   - Every exercise must have a non-empty `explanation` that teaches the rule, not just states the answer.
   - Difficulty 1 = single form/word, 2 = short phrase, 3 = full clause transformation.
   - Distribute difficulty: 40% easy, 40% medium, 20% hard.

5. **Output** a JSON array ready to insert into `src/data/seed/exercises-module2.json`. After generating, ask if the user wants to run the seed script or review individual items.
