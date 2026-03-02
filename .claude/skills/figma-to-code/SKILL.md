---
name: figma-to-code
description: Translate Figma designs or UI specs into React + Tailwind components
user-invocable: true
---

# Figma to Code (UI/UX Designer)

Translate a Figma design or written UI spec into production-ready React + Tailwind components. Acts as the UI/UX Designer → Frontend Engineer handoff step.

> **Reference:** Read `.claude/references/ui-feedback.md` before starting — it covers the agentation workflow for visual corrections.

## Instructions

Use this skill when:
- A Figma frame URL or screenshot is provided
- A written UI spec describes a new screen or component
- An existing component needs a visual redesign

---

### Step 1 — Understand the Design Input

Accept one of:
1. **Figma URL** — use the Figma MCP tool (if connected) to extract frame data
2. **Screenshot / image** — read the image to understand layout, spacing, components
3. **Written spec** — parse the description into a component tree

Extract:
- Component hierarchy (which components nest inside what)
- Spacing / sizing (translate to Tailwind: `p-4`, `gap-3`, `w-full`, etc.)
- Color tokens (map to shadcn CSS variables: `bg-primary`, `text-muted-foreground`, etc.)
- Typography (map to Tailwind: `text-sm font-medium`, `text-2xl font-bold`, etc.)
- Interactive states (hover, focus, disabled, loading)
- Mobile vs desktop layout differences

---

### Step 2 — Map Design Tokens to Tailwind

Always use CSS variable-based tokens (shadcn theme), not hardcoded colors:

| Design intention | Tailwind class |
|-----------------|---------------|
| Primary action | `bg-primary text-primary-foreground` |
| Secondary/muted | `bg-secondary text-secondary-foreground` |
| Destructive | `bg-destructive text-destructive-foreground` |
| Card surface | `bg-card text-card-foreground` |
| Muted text | `text-muted-foreground` |
| Border | `border border-input` |
| Background | `bg-background` |

Dark mode: every color class must have a `dark:` counterpart if not using CSS variables.

---

### Step 3 — Component Structure Rules

Follow project conventions:
- Named exports only: `export function MyComponent(...)`
- Props interface defined: `interface MyComponentProps { ... }`
- No data fetching inside the component — receive data as props
- Use shadcn/ui primitives (`Card`, `Button`, `Input`, `Dialog`) as base
- Touch targets minimum 44x44px: `min-h-11 min-w-11`
- Mobile-first: base styles for 375px, then `md:` and `lg:` breakpoints

---

### Step 4 — Accessibility Checklist

Every new component must pass:
- [ ] All interactive elements have accessible labels (`aria-label` or visible text)
- [ ] Color is not the only way to convey information
- [ ] Focus order is logical (follows DOM order)
- [ ] Loading states have `role="status"` and `aria-label`
- [ ] Images have `alt` text
- [ ] Form inputs have associated `<label>` or `aria-label`
- [ ] Error messages linked to inputs via `aria-describedby`

---

### Step 5 — Danish Input Components

Any text input where the user types Danish must include virtual keys:

```tsx
import { DanishInput } from '@/components/ui/DanishInput'

<DanishInput
  value={answer}
  onChange={setAnswer}
  onSubmit={handleSubmit}
  placeholder="Skriv svaret her..."
/>
```

---

### Output Format

Produce:
1. The component file(s) to create/modify
2. Where to place them in `src/components/`
3. Any new shadcn primitives needed (check if already in `src/components/ui/` first)
4. Accessibility notes for anything non-obvious
5. A note if the design requires a Figma token or asset not yet in the design system
