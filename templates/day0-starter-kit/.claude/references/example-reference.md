---
# IMPORTANT: Every reference MUST have globs targeting relevant files.
# This auto-loads the reference when the AI opens matching files.
# Without globs, references are dead weight — they exist but never load.
globs:
  - "src/lib/example*.ts"
  - "src/hooks/useExample*.ts"
---

# Example Reference

> This is a template. Replace with your domain-specific knowledge.

## When This Loads

This reference auto-loads when the AI opens any file matching the globs above.
This is the highest-ROI context engineering pattern — zero manual effort, always relevant.

## How to Write Good References

1. **Target specific files** via `globs:` — the narrower, the better
2. **Include code patterns** the AI should follow (with examples)
3. **Include anti-patterns** the AI should avoid (with examples)
4. **Keep it concise** — if it's over 100 lines, split into multiple references
5. **Update when patterns change** — stale references cause wrong code

## Example Content

```typescript
// CORRECT pattern for this domain:
const result = doThingCorrectly(input)

// WRONG — never do this:
const result = doThingIncorrectly(input) // because: [reason]
```
