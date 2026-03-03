# Plan: Mobile Header Redesign

> **Backlog item:** BL-033 | **Priority:** p1 | **Effort:** m | **Status:** ready
> **Created:** 2026-03-03

## Problem

Three mobile UI issues from live device testing (iPhone, 375px):

1. **Duplicate dictionary search** -- header pink search icon + DictionaryPage's own search input both visible on mobile
2. **Hidden header icons** -- game controls and utility buttons overflow or get cut off on narrow screens
3. **Sidebar-header gap** -- 1px visual gap between header and sidebar drawer on mobile

## Approach

Move all utility icons into the sidebar on mobile. Header becomes minimal: hamburger + logo + module selector only.

## Files to Modify (6)

| File | Changes |
|------|---------|
| `src/components/layout/Layout.tsx` | Lift `supportOpen` + `isDark` state from Header; pass to Header/Sidebar; render SupportDialog at Layout level; fix drawer 1px gap |
| `src/components/layout/Header.tsx` | Accept lifted state as props; wrap right toolbar in `hidden md:flex`; hide mobile search icon; add `useLocation` to hide search on `/dictionary` for desktop |
| `src/components/layout/Sidebar.tsx` | Add "Quick Actions" section (`md:hidden`) with all utility icons |
| `src/pages/DictionaryPage.tsx` | Change mobile search breakpoint from `sm:hidden` to `md:hidden` |
| `src/data/translations/en.ts` | Add `sidebar.quickActions` key |
| `src/data/translations/da.ts` | Add `sidebar.quickActions` key |

## Implementation Steps

### Step 1: Add translation keys

- `en.ts`: `'sidebar.quickActions': 'Quick Actions'`
- `da.ts`: `'sidebar.quickActions': 'Hurtige handlinger'`

### Step 2: Layout.tsx -- Lift state, fix drawer gap

**Lift from Header to Layout:**
- `supportOpen` / `setSupportOpen` state -- render `<SupportDialog>` here
- `isDark` / `handleThemeToggle` state + function

**Pass new props to Header:**
- `onOpenSupport`, `isDark`, `onToggleTheme`

**Pass new props to both Sidebar instances (desktop + mobile drawer):**
- `isDark`, `onToggleTheme`, `bubblesEnabled`, `onToggleBubbles`, `bubbleScore`, `onOpenGamePanel`, `onOpenSupport`, `onSignOut`, `user`

**Fix drawer gap:** Change mobile drawer from `top-14` to `top-[calc(3.5rem-1px)]` and height to `h-[calc(100vh-3.5rem+1px)]` to overlap the header border by 1px. Add `shadow-lg` for visual depth.

### Step 3: Header.tsx -- Simplify mobile header

**Remove local state** (lifted to Layout):
- `supportOpen` / `setSupportOpen`
- `isDark` / `setIsDark` / `handleThemeToggle`
- `SupportDialog` import + JSX

**Update props interface** to accept `onOpenSupport`, `isDark`, `onToggleTheme`.

**Hide right toolbar on mobile:** Change the right toolbar wrapper from `flex` to `hidden md:flex`. This hides ALL utility icons on mobile.

**Hide mobile search icon:** Search is now in the sidebar -- wrap in `hidden md:block` or remove the mobile-specific button.

**Keep desktop search bar** (`hidden md:flex`) unchanged.

### Step 4: Sidebar.tsx -- Add Quick Actions section

Add new props to `SidebarProps`:
```ts
isDark?, onToggleTheme?, locale?, onToggleLocale?,
bubblesEnabled?, onToggleBubbles?, bubbleScore?,
onOpenGamePanel?, onOpenSupport?, onSignOut?
```

Add a **"Quick Actions"** section wrapped in `md:hidden` at the top of the sidebar nav (above Home):

```
+------------------------------+
| QUICK ACTIONS                |
| Search Dark Lang Game Trophy |
| Support  Sign in/out         |
+------------------------------+
| HOME                         |
|  Dashboard                   |
| PRACTICE                     |
|  Quiz, Drill, ...            |
| ...                          |
+------------------------------+
```

Each icon: `min-h-11 min-w-11` (44px touch targets), `h-5 w-5` icons, horizontal flex-wrap row.

Buttons:
1. **Search** -- navigates to `/dictionary`, closes sidebar
2. **Dark mode** -- toggles theme via `onToggleTheme`
3. **Language** -- toggles locale via `useTranslation()` hook
4. **Game toggle** -- `onToggleBubbles`, shows enabled/disabled state
5. **Trophy** -- only when bubbles enabled, opens game panel, closes sidebar
6. **Support** -- opens support dialog via `onOpenSupport`, closes sidebar
7. **Sign in/out** -- Link to `/login` or calls `onSignOut`

### Step 5: DictionaryPage.tsx -- Align breakpoints

Change mobile search from `sm:hidden` to `md:hidden` so it's visible at 640-767px (tablets in portrait still use mobile drawer, so they need the page-level search input).

## Breakpoint Summary

| Width | Header | Sidebar | Dictionary Search |
|-------|--------|---------|-------------------|
| <768px (mobile) | Hamburger + Logo + Module only | Drawer with Quick Actions | Page-level input (`md:hidden`) |
| 768px+ (desktop) | Full toolbar with all icons | Static sidebar, no Quick Actions | Desktop header search bar |

## Verification

1. `npx tsc --noEmit` -- zero errors
2. `npm run lint` -- zero errors
3. `npm run build` -- success
4. Manual test at 375px: header minimal, sidebar has all icons, dictionary has single search input
5. Manual test at 768px+: header unchanged, sidebar unchanged
6. No gap between header and sidebar drawer on mobile
7. All sidebar quick action buttons work: search, dark mode, language, game, trophy, support, sign in/out
