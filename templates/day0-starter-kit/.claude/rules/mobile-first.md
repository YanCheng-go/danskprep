# Mobile-First Development

## Core Principle

Mobile-first means **building for mobile first**, not "building for desktop then fixing mobile later."

## Rules

### Layout
- Base styles target 375px (smallest supported viewport)
- Use `md:` and `lg:` breakpoints to enhance for larger screens
- Never use fixed widths — use `max-w-*`, `w-full`, percentages
- Test for horizontal overflow: no element should cause horizontal scroll at 375px

### Before Every PR Merge
- [ ] Open Chrome DevTools → device toolbar → iPhone SE (375px)
- [ ] Verify no horizontal overflow
- [ ] Verify all touch targets are at least 44x44px
- [ ] Verify text is readable without zooming
- [ ] Test both portrait and landscape

### Navigation
- Mobile: hamburger menu / bottom nav / sidebar drawer
- Desktop: full sidebar or top nav
- Design the mobile navigation FIRST, then enhance for desktop

### Inputs
- Virtual keyboard pushes content up — ensure submit buttons remain visible
- Use `inputmode` attribute for appropriate keyboard type
- Touch targets: `min-h-11 min-w-11` (44px) on all interactive elements

### Common Mistakes to Avoid
- `overflow-hidden` on containers that clip dropdowns on mobile
- Fixed headers that don't account for iOS safe area
- Hover-only interactions with no touch/click equivalent
- Modals/panels that don't go full-screen on mobile
