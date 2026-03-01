# Save Prompt

Save a prompt to the project's prompt library for versioning and reuse.

## Context

Claude Code already saves full conversation transcripts automatically at:
```
~/.claude/projects/<project-hash>/<session-id>.jsonl
```
These are raw session logs — every message, tool call, and result. They're searchable but not curated.

This skill maintains a **curated prompt library** in `prompts/` — only the prompts worth keeping and reusing, with descriptions and version history tracked by git.

---

## When to use

Use whenever:
- A prompt produces a high-quality result worth repeating
- A prompt defines a repeatable workflow (e.g. "generate 20 cloze exercises for topic X")
- A prompt is likely to be refined over time (track changes via git diff)
- The user explicitly asks to save a prompt

---

## Checklist

### Step 1 — Create the prompts/ directory if it doesn't exist

```
prompts/
├── README.md          # index of all saved prompts
├── exercises/         # prompts for generating exercises
├── scraping/          # prompts related to scraping tasks
└── content/           # prompts for Danish content generation
```

### Step 2 — Save the prompt

Create a file: `prompts/{category}/{slug}.md`

Template:
```markdown
# {Title}

**Category:** {category}
**Created:** {YYYY-MM-DD}
**Last used:** {YYYY-MM-DD}

## Purpose

{One sentence: what this prompt is for and when to use it.}

## Prompt

```
{exact prompt text}
```

## Notes

- {Any context about what works well or what to watch out for}
- {Examples of good outputs, or links to output files}

## Changelog

- {YYYY-MM-DD}: {what changed}
```

### Step 3 — Update prompts/README.md index

Add a row to the table:

| File | Purpose | Last used |
|------|---------|-----------|
| `exercises/generate-cloze.md` | Generate cloze exercises for a grammar topic | 2026-03-01 |

### Step 4 — Commit

```bash
git add prompts/
git commit -m "prompts: save {title} prompt"
```

---

## Example saved prompt

`prompts/exercises/generate-cloze.md`:

```markdown
# Generate Cloze Exercises

**Category:** exercises
**Created:** 2026-03-01
**Last used:** 2026-03-01

## Purpose

Generate fill-in-the-blank (cloze) exercises for a Danish grammar topic, formatted as DanskPrep seed JSON.

## Prompt

Generate 10 cloze exercises for the grammar topic "omvendt ordstilling" (inverted word order / V2 rule) at PD3 Module 2 level.

Format each as:
{
  "grammar_topic_slug": "inverted-word-order",
  "exercise_type": "cloze",
  "question": "sentence with ___ blank",
  "correct_answer": "answer",
  "alternatives": null,
  "hint": null,
  "explanation": "...",
  "module_level": 3,
  "difficulty": 2,
  "source": "generated"
}

Rules:
- Each sentence must have exactly one blank with an unambiguous correct answer
- Sentences must be original (not copied from textbooks)
- Difficulty 1 = short sentence, 2 = medium, 3 = complex/long
- The blank should test the grammar rule, not vocabulary

## Notes

- Works best when you specify the exact sub-rule (e.g. "inversion after adverbials" vs "inversion after objects")
- Output quality improves if you give 2–3 example sentences first
```
