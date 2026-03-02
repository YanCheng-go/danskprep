# UI Feedback & Visual Corrections

## Default Tool: Agentation
When the user reports a visual/layout issue, references a screenshot, or asks for UI corrections:
1. **Use agentation annotations** as the primary source of truth for element identification (selectors, CSS classes, bounding boxes)
2. Reference the `.elementPath` and `.cssClasses` from annotations to locate the exact code
3. Use the `max-w-2xl mx-auto px-4` pattern from `PageContainer` as the alignment reference for all content

## Setup
- `agentation` is installed as an npm dependency
- Rendered in `src/components/layout/Layout.tsx` as `{import.meta.env.DEV && <Agentation />}`
- Only loads in development — tree-shaken from production builds
- Toolbar appears in the bottom-right corner during `npm run dev`

## Workflow
1. User activates agentation toolbar, clicks elements, adds notes
2. Copies structured output (includes React component tree, CSS selectors, positions)
3. Pastes into chat — use the selectors and component paths to find and fix the code
4. Verify fix with `npx tsc --noEmit && npm run build`
