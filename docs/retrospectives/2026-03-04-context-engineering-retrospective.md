# Context Engineering Retrospective

**Date:** 2026-03-04
**Project:** DanskPrep v0.1.0 → v0.8.0
**Scope:** 145 commits, 100 PRs, 8 releases, 4 days (March 1–4, 2026)
**Author:** Claude Opus 4.6 + Yan Cheng

---

## Executive Summary

Most rework in DanskPrep came from context that should have guided the AI from commit #1 being added only after mistakes were already made. Rules were reactive (fix bug → write rule) instead of proactive (write rule → prevent bug). Only 2 of 8 rules existed before the first commit. The `/commit` skill needed 6 iterations because the workflow was automated before it was designed on paper.

This document captures every lesson learned, organized for reuse in future projects.

---

## Timeline

| Day | Versions | Key Activity | Commits |
|-----|----------|-------------|---------|
| Mar 1 | v0.1.0 | Bootstrap → full app → Vercel → CI → data pipeline | ~15 |
| Mar 2 | v0.2–v0.4.1 | Drill, feedback, writing/speaking, guest mode, bubble game, mobile fixes | ~60 |
| Mar 3 | v0.5–v0.7.0 | Vocab enrichment, a11y, agent ecosystem, GitHub Projects, quiz config | ~45 |
| Mar 4 | v0.7.1–v0.8.0 | Mobile header, content pipeline (292→933 exercises), docs | ~25 |

Final state: 933 exercises, 595 words, 6 grammar topics, 22 skills, 7 agents, 8 rules, 7 references.

---

## What Went Wrong

### 1. CLAUDE.md Started Thin, Grew Reactively

The initial CLAUDE.md (commit `2838f54`) had a basic project overview, tech stack, and commands. Critical rules were added only after bugs:

| Rule added | After which problem |
|------------|-------------------|
| "Floating bubbles must be `interactive={true}`" | 3 PRs flip-flopping (#29, #30, #91) |
| "Unused imports fail CI" | Multiple CI failures |
| "No `asChild` on Button" | Repeated incorrect code generation |
| Guest-first UX | Retrofitting 15+ files in v0.4.0 |
| Mobile-first enforcement | Header redesigned 3 times |
| A11y requirements | 5+ separate a11y fix PRs |

**Pattern:** AI makes mistake → human notices → rule added → AI stops. But 5-10 instances already exist.

**Lesson:** Write CLAUDE.md as a **design document before commit #1**, not a growing FAQ of "things the AI got wrong."

### 2. Rules Were Pitfall Patches, Not Design Constraints

| Rule | When added | Trigger |
|------|-----------|---------|
| `react-conventions.md` | Day 1 | Initial scaffold |
| `typescript-tooling.md` | Day 1 | Initial scaffold |
| `supabase-workflow.md` | Day 2 | Forgot to sync migrations |
| `nix-system-deps.md` | Day 2 | Someone tried `brew install` |
| `python-lint.md` | Day 3 | Ruff errors in PRs |
| `ui-feedback.md` | Day 3 | Couldn't locate UI elements |
| `github-sync.md` | Day 3 | .claude/ and .github/ diverged |
| `dev-guide-sync.md` | Day 4 | DEVELOPMENT.md went stale |

Only 2/8 existed from Day 1. The other 6 were patches for problems that already happened.

**Lesson:** Split rules into **architectural** (write before first commit) and **pitfall** (fine to add reactively).

### 3. Skills Were Built After the Workflow Existed Manually

- `/commit` created Day 2, modified 6 times through Day 3
- `/release` built after manual version bumps
- `/backlog` rewritten entirely when migrating from file to GitHub Projects
- `/daily`, `/weekly` added Day 3 after the pattern was already informal

11 skills created in commit #1, several deleted or rewritten later.

**Lesson:** Design the 3 core lifecycle skills on paper first, then automate once. Don't speculate on domain skills before the domain stabilizes.

### 4. Agents Had No Activation Criteria

7 agents exist as `.md` files but no clear trigger for when to use each. Two original agents (`db-migrator`, `quiz-builder`) were created in commit #1 and deleted in PR #33 — they overlapped with skills.

**Lesson:** Start with 1-2 agents. Every agent needs explicit activation criteria. Skills should be primary; agents orchestrate skills.

### 5. References Lacked Glob Targeting Initially

Three references use `globs:` frontmatter to auto-load when relevant files are opened — excellent pattern. But 4/7 references don't have globs and rely on manual skill loading.

**Lesson:** Every reference should have `globs:` from the start. Zero-overhead, always-relevant context.

---

## Architectural Decisions That Should Have Been Day 0

### Stable IDs

Exercises used array-index IDs. Migration to stable IDs (BL-041) is still open at 933 exercises. At 201 exercises this was trivial.

**Next time:** `sha256(source + topic + prompt)[:12]` from first import.

### Database-First Content

All content bundled as JSON. Grew from ~100KB to ~500KB+. Content updates require redeploy.

**Next time:** DB-first from start. Seed JSON as bootstrap/fallback only.

### Guest-First Auth

Guest mode added v0.4.0 after drill, feedback, writing/speaking were built with auth assumptions. Touched 15+ files.

**Next time:** Guest by default → sign-in for persistence. Day 1 architecture.

### i18n Framework

Added v0.3.0, hardcoded strings still scattered (BL-006, BL-007).

**Next time:** `t('key')` from the first component or decide "no i18n" explicitly.

### Accessibility

5+ PRs for a11y fixes. ~130 WCAG color contrast violations still open.

**Next time:** `eslint-plugin-jsx-a11y` in CI from Day 1. Per-component checklist.

### Mobile-First

Header redesigned 3 times. Floating bubbles needed 3 PRs. Multiple overflow fixes.

**Next time:** Test 375px before merging. Mobile-first means building mobile first, not adding mobile after.

### Security Model

API keys in localStorage (XSS risk), no CSP, no rate limiting — all still open.

**Next time:** Design security model alongside the feature that needs it.

---

## What Went Right (Keep These)

1. **TypeScript strict from Day 1** — caught bugs early, enforced discipline
2. **CLAUDE.md as living document** — single source of truth, continuously updated
3. **Three-tier context loading** (CLAUDE.md always → rules always → references on-demand)
4. **Frequent small releases** — 8 releases in 4 days, tight feedback loops
5. **Checkpoints in agents** — human approval before irreversible actions
6. **Learning filter in coder agent** — prevents context bloat
7. **`/commit` skill with self-review** — catches issues before human review
8. **Dual-path sync** (`.claude/` for AI, `.github/` for humans)
9. **Seed data as versionable JSON** — easy to inspect, diff, validate
10. **Nix + direnv** — reproducible environment

---

## The 7 Context Engineering Principles

### 1. Rules Before Code, Not After Bugs
Architectural rules before first commit. Pitfall rules can be reactive.

### 2. One Source of Truth per Concern
DanskPrep had version in 3 places, backlog in 2 systems, UI rules in both `rules/` and `references/`. Every piece of knowledge should live in exactly one place.

### 3. Globs Are the Best Context Engineering
`globs:` frontmatter on references delivers the right context at the right time with zero manual effort. Use it everywhere.

### 4. Skills > Agents for Most Work
Skills are predictable, testable, composable. Agents are autonomous but harder to control. Default to skills.

### 5. Design Workflows on Paper, Then Automate Once
`/commit` was modified 6 times. The final workflow was predictable. Write the workflow as a document first.

### 6. Don't Speculate — Build When You Need It
11 skills in commit #1, many deleted/rewritten. Create when you have a concrete, repeatable workflow.

### 7. The Learning Filter Is Essential
"Add only if confirmed across multiple interactions." "Always simplify to shortest useful form." Apply to all rule/reference creation.

---

## Rework Costs (Quantified)

| Issue | PRs spent | What it could have been |
|-------|----------|----------------------|
| Floating bubbles UX | 3 PRs (#29, #30, #91) | 0 — define interaction model upfront |
| Mobile header | 4 PRs (#27, #35, #89, #91) | 1 — design mobile-first from start |
| A11y fixes | 5+ PRs (#35, #40, #87, etc.) | 0 — a11y lint in CI from Day 1 |
| `/commit` skill iterations | 6 modifications | 1 — design on paper first |
| Superseded PRs | 5 PRs closed (#13-15, #17-18) | 0 — plan before PR |
| Guest mode retrofit | 1 large PR touching 15+ files | 0 — guest-first architecture |
| Backlog migration | 1 large PR (786+/862-) | 0 — choose GitHub Projects from start |
| Version sync bugs | Multiple hotfix commits | 0 — single source of truth for version |

**Estimated:** ~25 PRs of rework that could have been 0-3 PRs with upfront design.

---

## Day 0 Checklist for Next Project

Before the first feature commit, verify:

- [ ] CLAUDE.md has architecture decisions (auth, data flow, IDs, i18n, security)
- [ ] CLAUDE.md has UX invariants (mobile viewport, touch targets, a11y, interaction rules)
- [ ] CLAUDE.md has quality gates (tsc, lint, test, build, a11y lint, mobile check)
- [ ] 4-6 architectural rules exist (data, auth, a11y, mobile, security, shipping)
- [ ] `/commit`, `/backlog`, `/release` skills are fully designed
- [ ] 1-2 core agents only (`coder` with learning filter, `reviewer`)
- [ ] All references have `globs:` targeting relevant source files
- [ ] `settings.local.json` pre-approves safe commands
- [ ] CI includes a11y lint (`eslint-plugin-jsx-a11y`)
- [ ] Dependency strategy configured (Dependabot grouping, weekly merge window)
- [ ] Data model decided (stable IDs, DB-vs-bundled, seed format)
- [ ] i18n decision made (yes/no), framework chosen if yes
- [ ] Guest flow designed if applicable

See `templates/day0-starter-kit/` for the ready-to-copy template.
