---
name: qa-review
description: "Audit test coverage and write missing tests"
user-invocable: true
---

# /qa-review — Test Coverage Audit

## Steps

### Step 1: Gather Coverage Data
```bash
npm test -- --run --coverage
```

### Step 2: Find Test Files
Scan for existing test files (`.test.ts`, `.test.tsx`, `.spec.ts`).

### Step 3: Coverage Status Table

| Area | File | Has Tests | Coverage | Priority |
|------|------|-----------|----------|----------|
| ... | ... | yes/no | %/unknown | high/med/low |

Priority is based on: complexity, risk if broken, frequency of change.

### Step 4: Write Missing Tests
For each high-priority gap:
1. Write failing test first (BDD naming: "should X when Y")
2. Verify it fails for the right reason
3. If fixing a bug, the test should reproduce the bug

### Step 5: Quality Gate
```bash
npm test -- --run    # All tests pass
npx tsc --noEmit     # No type errors from test files
```

## Test Conventions
- Co-locate tests: `foo.test.ts` next to `foo.ts`
- BDD naming: `describe('functionName', () => { it('should X when Y', ...) })`
- Test behavior, not implementation
- Regression rule: write a failing test before fixing any bug
