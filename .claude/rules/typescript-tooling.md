---
globs:
  - "vite.config.ts"
  - "tsconfig*.json"
  - "src/**/*.ts"
  - "src/**/*.tsx"
---

# TypeScript & Tooling Conventions

## Vite + Vitest Config — Version Conflict Pitfall

**Problem**: Using `import { defineConfig } from 'vitest/config'` causes a `Plugin<any>` type mismatch because vitest bundles its own copy of vite internally. The two vite versions have incompatible Plugin types, producing errors like:
```
Type 'Plugin<any>' is not assignable to type 'PluginOption'
Types of property 'apply' are incompatible
```

**Correct setup** — keep vite's `defineConfig`, suppress the `test` property type error:
```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vite'   // ← from 'vite', NOT 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // @ts-expect-error vitest augments UserConfig with 'test'
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
```

## Vite Environment Variables — Missing Type Reference

`import.meta.env` is not typed by default in TypeScript. Without the Vite client type reference, you get:
```
Property 'env' does not exist on type 'ImportMeta'
```

**Fix**: Ensure `src/vite-env.d.ts` exists with:
```typescript
/// <reference types="vite/client" />
```
This file must be included in `tsconfig.json`'s `include` array (including `"src"` covers it).

## Bootstrapping Vite in an Existing Directory

`npm create vite@latest . -- --template react-ts` will prompt for confirmation when the directory already has files, and **cannot be automated** with stdin piping — it always cancels.

**Solution**: Create the config files manually when the directory already has content:
- `package.json` (write by hand with correct deps)
- `vite.config.ts`
- `tsconfig.json`
- `index.html`
- `src/main.tsx`
- `src/vite-env.d.ts`
- `tailwind.config.js` + `postcss.config.js`

## Tailwind v3 vs v4 — Use v3 for shadcn/ui Compatibility

This project uses **Tailwind CSS v3** (not v4), despite v4 being available. Reasons:
- CLAUDE.md specifies `Tailwind 3.x`
- shadcn/ui has more stable v3 support
- v3 uses `tailwind.config.js` + `postcss.config.js` (familiar, well-documented)
- v4 uses `@tailwindcss/vite` plugin + CSS-only config — a different setup entirely

**Tailwind v3 setup** (what this project uses):
```bash
npm install -D tailwindcss@^3 postcss autoprefixer
```
Config files: `tailwind.config.js` (with `content` glob) + `postcss.config.js`
CSS entry: `@tailwind base; @tailwind components; @tailwind utilities;`

**Do NOT** install `@tailwindcss/vite` — that is Tailwind v4 only.

## shadcn/ui Components — Install Manually (No CLI)

This project copies shadcn/ui component source directly into `src/components/ui/`. Do not run `npx shadcn-ui@latest add` — it may conflict with the project's manual setup.

When adding a new shadcn/ui component:
1. Copy the component source from [ui.shadcn.com](https://ui.shadcn.com/docs/components)
2. Adjust imports to use `@/lib/utils` for `cn()`
3. Remove any Radix UI dependencies the project doesn't have installed

## Answer Checking — Damerau-Levenshtein, Not Standard Levenshtein

Standard Levenshtein counts **transpositions** (swapping two adjacent characters) as **2 operations**. This means 'bilne' vs 'bilen' has distance 2, and a typo tolerance of 1 would miss it.

**Always use `damerauLevenshtein()` from `src/lib/answer-check.ts`** for typo detection. It counts transpositions as 1 operation, which matches real typing mistakes.

```typescript
// ❌ Standard Levenshtein — misses transposition typos
levenshtein('bilne', 'bilen')          // → 2 (transposition counts as 2)

// ✓ Damerau-Levenshtein — catches transpositions
damerauLevenshtein('bilne', 'bilen')   // → 1 (correct for typo tolerance)
```

Use `checkAnswer()` from the same file — it uses Damerau-Levenshtein internally and also handles Danish normalization (ae→æ, case folding, etc.).

## TypeScript Strict Mode — Quick Reference

With `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`:

| Mistake | Error | Fix |
|---------|-------|-----|
| Unused import | `'Foo' is declared but never read` | Remove the import |
| Unused parameter | `'bar' is declared but its value is never read` | Prefix with `_` or remove |
| `any` without comment | `Implicit 'any'` | Add explicit type or `// eslint-disable-next-line` with reason |
| `import.meta.env` without vite-env.d.ts | `Property 'env' does not exist` | Add `src/vite-env.d.ts` |

Always run `npx tsc --noEmit` before committing to catch these early.
