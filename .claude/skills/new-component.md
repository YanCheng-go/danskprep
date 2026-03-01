# New Component

Scaffold a new React component following DanskPrep's conventions: TypeScript strict, functional, Tailwind-styled, no data fetching in the component.

## Instructions

1. **Determine component type** from the user's request:
   - `ui` → `src/components/ui/` — primitive, shadcn-based, no business logic
   - `study` → `src/components/study/` — flashcard/review UI
   - `quiz` → `src/components/quiz/` — quiz question rendering
   - `grammar` → `src/components/grammar/` — grammar reference UI
   - `progress` → `src/components/progress/` — stats/chart UI
   - `layout` → `src/components/layout/` — structural/navigation UI
   - `page` → `src/pages/` — page-level component (add route in App.tsx)

2. **Component template** (strictly follow this pattern):
   ```tsx
   // PascalCase filename, named export, no default export
   interface ComponentNameProps {
     // all props typed — no `any`
   }

   export function ComponentName({ prop1, prop2 }: ComponentNameProps) {
     return (
       <div className="...tailwind classes...">
         {/* content */}
       </div>
     );
   }
   ```

3. **Rules to enforce:**
   - Named export, NOT default export
   - Props interface always defined, even if empty
   - No inline data fetching — receive data as props
   - No CSS modules — Tailwind only
   - Dark mode support: use `dark:` variants alongside light variants
   - Mobile-first: start with mobile layout, add `md:` / `lg:` for larger screens
   - Touch-friendly tap targets: minimum 44×44px for interactive elements
   - Danish characters: if the component handles text input, include æøå virtual key buttons

4. **If creating a quiz component**, also create a co-located test file:
   ```
   ComponentName.tsx
   ComponentName.test.tsx
   ```
   Scaffold the test with React Testing Library imports and a basic render test.

5. **If creating a page component:**
   - Add it to the router in `src/App.tsx`
   - Use `<PageContainer>` as the outermost wrapper

6. **Write the file(s)** and confirm what was created.
