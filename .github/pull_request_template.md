## Summary
<!-- 2–4 bullet points: what changed and why -->
-
-

## Type of change
<!-- Check all that apply -->
- [ ] Bug fix
- [ ] New feature
- [ ] Refactor / code quality
- [ ] Content / data (exercises, vocabulary, grammar)
- [ ] CI/CD / tooling
- [ ] Documentation
- [ ] Security fix

## SDLC checklist

### Code quality
- [ ] `npx tsc --noEmit` — no TypeScript errors
- [ ] `npm run lint` — no ESLint errors
- [ ] `npm test -- --run` — all tests pass
- [ ] `npm run build` — production build succeeds

### Content (if exercises / Danish text changed)
- [ ] `/review-danish` run — grammar verified
- [ ] All exercises have `source` field set correctly
- [ ] Seed JSON is valid UTF-8 with literal æ/ø/å

### Security (if auth / DB / env changed)
- [ ] No secrets committed (check `git diff` for API keys, tokens)
- [ ] Supabase RLS still enforced on affected tables
- [ ] No new `createClient` instances outside `src/lib/supabase.ts`

### Architecture (if schema / types / hooks changed)
- [ ] `supabase/migrations/` — new migration added if schema changed
- [ ] Existing migration files not modified
- [ ] Types in `src/types/` updated to match schema

### Documentation
- [ ] `NOTES.md` — completed items checked off, new todos added
- [ ] `README.md` — updated if user-facing behaviour changed
- [ ] `CLAUDE.md` — updated if conventions changed

## Claude review
<!-- Paste the output of /review <pr-number> below before requesting human merge -->
<details>
<summary>Claude code review output</summary>

```
(paste here)
```
</details>

---
🤖 Generated with [Claude Code](https://claude.com/claude-code)
