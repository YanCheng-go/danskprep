# Auth Model

## Guest-First Architecture

<!-- CUSTOMIZE: Adjust to your chosen auth model -->

Users can use the app immediately without signing in. Sign-in unlocks persistence and sync.

### What works without auth
- Browse all content
- Take quizzes and drills
- View grammar topics and vocabulary

### What requires sign-in
- Save progress across sessions
- Sync data across devices
- Submit user-generated content
- Access personal statistics

### Implementation Rules

1. **Never assume authentication** — every page must render for guests
2. **No auth guards on read-only content** — only gate write operations
3. **Show sign-in CTAs contextually** — when a guest tries a gated action, show a sign-in prompt explaining the benefit (e.g., "Sign in to save your progress")
4. **Guest state is ephemeral** — lost on page refresh, and that's OK
5. **Design components auth-agnostic** — pass `isGuest` as a prop, don't check auth inside components
