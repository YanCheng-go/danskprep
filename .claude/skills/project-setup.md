# Skill: Project Setup & Bootstrap

## Quick Start

### 1. Initialize the project

```bash
npm create vite@latest danskprep -- --template react-ts
cd danskprep
```

### 2. Install dependencies

```bash
# Core
npm install react-router-dom @supabase/supabase-js ts-fsrs

# UI
npm install -D tailwindcss @tailwindcss/vite
npm install class-variance-authority clsx tailwind-merge lucide-react

# shadcn/ui setup
npx shadcn@latest init
# Choose: TypeScript, Default style, CSS variables, base color Slate
# Install specific components as needed:
npx shadcn@latest add button card dialog input label tabs badge progress

# Dev
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

### 3. Configure Vite

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
```

### 4. Configure TypeScript paths

```json
// tsconfig.json — add to compilerOptions:
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### 5. Configure Tailwind

```css
/* src/index.css */
@import "tailwindcss";
```

### 6. Environment variables

```bash
# .env.local (DO NOT COMMIT)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your-anon-key
```

```bash
# .env.example (commit this)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

### 7. Supabase setup

```bash
# Install Supabase CLI
npm install -D supabase

# Login and link to project
npx supabase login
npx supabase link --project-ref your-project-ref

# Run migrations
npx supabase db push

# Generate TypeScript types
npx supabase gen types typescript --linked > src/types/database.ts
```

### 8. Seed the database

```bash
# Set service key (not anon key) for seeding
export SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_SERVICE_KEY=eyJ...your-service-key

# Run seed script
pip install supabase
python scripts/seed-database.py
```

## .gitignore

```
node_modules/
dist/
.env.local
.env*.local
*.log
.DS_Store
```

## Package.json Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "test": "vitest",
    "test:run": "vitest run",
    "types": "npx supabase gen types typescript --linked > src/types/database.ts"
  }
}
```

## Test Setup

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom';
```

## VSCode Settings (Optional)

```json
// .vscode/settings.json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

## Folder Scaffolding

After `npm create vite`, create the project structure:

```bash
mkdir -p src/{components/{layout,study,quiz,grammar,progress,vocabulary,ui},pages,lib,hooks,types,data/seed,test}
mkdir -p supabase/migrations
mkdir -p scripts
```

## First Files to Create (In Order)

1. `src/lib/supabase.ts` — Supabase client
2. `src/types/database.ts` — Generated types (after migration)
3. `src/types/study.ts` — FSRS card types
4. `src/types/quiz.ts` — Exercise types
5. `src/lib/fsrs.ts` — FSRS wrapper
6. `src/lib/answer-check.ts` — Answer comparison
7. `src/hooks/useAuth.ts` — Auth hook
8. `src/components/layout/Layout.tsx` — App shell
9. `src/components/ui/DanishInput.tsx` — Danish keyboard input
10. `src/App.tsx` — Router setup
11. `supabase/migrations/001_initial_schema.sql` — Database schema
12. Seed data JSON files
13. Page components
14. Study + Quiz components

## Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard:
# VITE_SUPABASE_URL
# VITE_SUPABASE_ANON_KEY
```

Or connect GitHub repo to Vercel for auto-deploy on push.

## Key Rules

- Always use the `@/` path alias for imports. Never use relative paths like `../../`.
- Run `npm run types` after every schema change to regenerate database types.
- Never commit `.env.local` or any file containing keys.
- Test answer-checking logic thoroughly — it's the most error-prone part.
- Mobile-first: test on 375px viewport throughout development.
