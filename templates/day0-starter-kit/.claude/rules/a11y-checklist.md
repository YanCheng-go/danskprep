# Accessibility Checklist

## Per-Component Requirements

Every component must satisfy these before merge:

### Labels & Roles
- [ ] Icon-only buttons have `aria-label` describing the action
- [ ] Custom widgets (dropdowns, tabs, modals) have correct ARIA `role`
- [ ] Form inputs have associated `<label>` elements or `aria-label`
- [ ] Images have meaningful `alt` text (or `alt=""` if decorative)

### Keyboard Navigation
- [ ] All interactive elements are focusable (`tabIndex` if needed)
- [ ] Custom dropdowns/menus close on `Escape`
- [ ] Focus is trapped inside modals when open
- [ ] Focus moves to new content after navigation (route changes)

### Color & Contrast
- [ ] Text meets WCAG AA contrast ratio (4.5:1 for normal text, 3:1 for large)
- [ ] Information is not conveyed by color alone (use icons, text, patterns too)
- [ ] Both light and dark mode meet contrast requirements

### Motion
- [ ] Animations respect `prefers-reduced-motion` media query
- [ ] No content relies solely on animation to convey meaning

### Touch
- [ ] Interactive elements are at least 44x44px
- [ ] Sufficient spacing between touch targets (no accidental taps)

## CI Enforcement

Add `eslint-plugin-jsx-a11y` to ESLint config:

```js
// eslint.config.js
import jsxA11y from 'eslint-plugin-jsx-a11y'

// Add to your config:
...jsxA11y.configs.recommended.rules
```

## Skip-to-Content

Every page layout must include a skip-to-content link as the first focusable element:

```tsx
<a href="#main-content" className="sr-only focus:not-sr-only focus:absolute ...">
  Skip to content
</a>
```
