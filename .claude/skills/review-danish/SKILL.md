---
name: review-danish
description: Review Danish text for grammatical accuracy and exam suitability
user-invocable: true
---

# Review Danish

Review Danish text (exercises, explanations, example sentences) for grammatical accuracy, natural phrasing, and suitability for Module 2 exam-level learners.

> **Reference:** Read `.claude/references/danish-content.md` first — it covers the grammatical accuracy rules to check against.

## Instructions

The user provides Danish text to review. Analyse it across these dimensions:

### 1. Grammatical Accuracy
Check for:
- **Word order**: V2 rule in main clauses, SOV in subordinate clauses
- **Verb conjugation**: correct present/past/perfect forms, irregular verbs
- **Noun gender**: en/et agreement in articles (en bil → bilen, et hus → huset)
- **Adjective agreement**: e-form vs t-form based on noun gender and definiteness
- **Pronoun case**: subject vs object forms (han/ham, hun/hende)
- **Negation placement**: "ikke" after verb in main clause, before verb in subordinate clause
- **Spelling**: ae/oe/aa used correctly (not ae/oe/aa unless testing that specifically)

### 2. Register & Naturalness
- Is the phrasing natural for everyday spoken/written Danish?
- Flag overly formal or artificial constructions that a native wouldn't say
- Check that contractions and colloquialisms match the target register (Module 2 = everyday, semi-formal)

### 3. Exam Suitability
- Is the vocabulary at Module 2 level? Flag words that are too advanced or too basic.
- Does the sentence clearly illustrate the grammar point it's meant to teach?
- Is the English translation (if provided) accurate and natural?

### 4. Exercise Quality (if reviewing exercises)
- Is the correct answer unambiguous?
- For cloze: is there only one correct fill-in, or could multiple answers work?
- For multiple choice: are the distractors plausible but clearly wrong?
- Is the explanation accurate and instructive?

### Output Format

For each issue found:
```
[SEVERITY] Location: "...quoted text..."
Issue: description of the problem
Fix: corrected version
Rule: which grammar rule applies
```

Severity levels: `ERROR` (incorrect), `WARNING` (unnatural/ambiguous), `NOTE` (style suggestion).

End with a summary count: X errors, Y warnings, Z notes. Give an overall quality rating: Ready / Needs fixes / Major issues.
