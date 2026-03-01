---
globs:
  - "src/components/**/*.tsx"
  - "src/pages/**/*.tsx"
  - "src/hooks/**/*.ts"
---

# React & TypeScript Conventions

## Components
- **Functional components only** — no class components
- **Named exports only** — never `export default`
- **Props interface always defined** — even if empty, name it `ComponentNameProps`
- **No data fetching inside components** — all data arrives via props; fetching lives in hooks or page components
- **File naming**: PascalCase for components (`FlashCard.tsx`), camelCase for utilities

## TypeScript
- **Strict mode** — no `any` types; if unavoidable, add a comment explaining why
- Use `interface` for data shapes; use `type` for unions and computed types
- All event handlers typed explicitly (e.g. `React.ChangeEvent<HTMLInputElement>`)

## Styling
- **Tailwind CSS only** — no CSS modules, no styled-components, no inline `style={}`
- **Mobile-first**: write base styles for 375px, add `md:` and `lg:` breakpoints on top
- **Dark mode**: every element that has a light-mode color must also have a `dark:` variant
- **Touch targets**: interactive elements must be at least 44×44px (use `min-h-11 min-w-11`)
- Use `shadcn/ui` primitives for buttons, inputs, cards, dialogs — customize via Tailwind, never by overriding CSS

## State Management
- **No Redux** — local state with `useState`/`useReducer`, shared state via custom hooks + Supabase
- Custom hooks prefixed with `use`, located in `src/hooks/`
- FSRS scheduling state lives in `useStudy` hook; never manage card state directly in components

## Danish Input
- Every text input where the user types Danish must include virtual key buttons for æ, ø, å
- Use the `danish-input.ts` utilities for character insertion
- Answer comparison must use `src/lib/answer-check.ts` normalisation (case-insensitive, trimmed, ae/æ equivalent)
- Answer comparison uses **Damerau-Levenshtein** (not standard Levenshtein) — transpositions count as 1 edit, matching real typo behaviour

## Button with Router Links — No asChild
This project's `Button` component does **not** use Radix UI's `Slot`, so `asChild` is not supported.

**Pattern for Link-styled buttons** (use `buttonVariants` + `<Link>`):
```tsx
import { Link } from 'react-router-dom'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// ✓ CORRECT
<Link to="/study" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}>
  Start studying
</Link>

// ❌ WRONG — asChild does not exist on ButtonProps
<Button asChild variant="outline">
  <Link to="/study">Start studying</Link>
</Button>
```

## Strict TypeScript — Unused Imports
With `noUnusedLocals: true`, every import must be used. Common culprits when refactoring:
- Removing `asChild` usage but leaving `buttonVariants` or `cn` imports
- Adding a type import then using a different approach
- Keeping `useState` in a component after extracting state to a hook
Always remove unused imports before committing — they'll fail `tsc --noEmit`.

## Routing
- React Router v6 — use `<Link>`, `useNavigate`, `useParams`
- All pages wrapped in `<PageContainer>` from `src/components/layout/`
