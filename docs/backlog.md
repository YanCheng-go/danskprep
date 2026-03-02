# DanskPrep Backlog

> Last updated: 2026-03-02 | Total: 2 | Ready: 1 | In Progress: 0

## Summary

| ID     | Title                                          | Type    | Area       | Pri | Effort | Status | Scope | Deps |
|--------|------------------------------------------------|---------|------------|-----|--------|--------|-------|------|
| BL-001 | Cloud storage for speaking recordings          | feature | ui         | p2  | l      | idea   | all   | —    |
| BL-002 | LLM-based seed data validation script          | infra   | dx         | p2  | m      | ready  | PD3M2 | —    |

## Items

<!-- New items appended below in ID order -->

### BL-001: Cloud storage for speaking recordings

- **Type:** feature | **Area:** ui | **Priority:** p2 | **Effort:** l
- **Status:** idea | **Scope:** all
- **Created:** 2026-03-02
- **Dependencies:** none

Audio recordings on /speaking are currently only held in-memory (blob URLs) and lost on page leave. Add cloud storage (Supabase Storage or similar) so users can save, replay, and track their speaking practice over time.

#### Notes

_No notes yet._

---

### BL-002: LLM-based seed data validation script

- **Type:** infra | **Area:** dx | **Priority:** p2 | **Effort:** m
- **Status:** ready | **Scope:** PD3M2
- **Created:** 2026-03-02
- **Dependencies:** none

Build a Python script (`scripts/validate-seed-data.py`) that uses Claude to scan all seed JSON files and flag data quality issues proactively.

**What it validates:**
- Null/empty fields where values are expected (e.g., word with no `english`, exercise with no `explanation`)
- Schema consistency across entries (same fields present on all items of the same type)
- Danish text quality — grammar errors, missing articles, wrong inflection patterns
- Exercise quality — cloze with ambiguous blanks, MC with <4 options, word_order with multiple valid orderings
- Duplicate detection — similar exercises or words that may be redundant
- Missing cross-references — exercises referencing grammar topics that don't exist
- Format violations — wrong exercise_type values, invalid difficulty ratings, malformed JSONB fields

**Implementation approach:**
- Read each seed file, validate schema with a JSON schema or Pydantic model first (fast, free)
- For content quality checks, batch entries and send to Claude Haiku (cheap: ~$0.02 per full scan)
- Output a validation report with severity levels (error/warning/info) and line references
- Can be run in CI or manually before releases

**Acceptance criteria:**
- Script runs via `cd scripts && uv run python validate-seed-data.py`
- Catches the known issue: 143 verbs with empty inflections
- Zero false positives on current clean data (exercises, grammar, prompts)
- Report format: JSON or markdown, machine-readable for CI integration

#### Notes

_No notes yet._

---
