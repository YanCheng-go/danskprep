# Save Decisions Early — Context Preservation Rule

## When this rule applies

During any conversation that involves design discussions, architectural decisions, workflow changes, or multi-topic planning sessions.

## What to do

When the conversation has covered 3+ distinct topics or made important decisions:

1. **Save decisions immediately** — don't wait for session end. Write key decisions to the appropriate place:
   - Design/architecture decisions → create backlog items or write to `docs/`
   - Workflow changes → update the relevant skill/rule file
   - User preferences → update MEMORY.md
   - New backlog items → create GitHub Issues right away

2. **Proactively ask the user** when you notice the conversation is getting long:
   - "We've covered several topics. Want me to capture the decisions so far before we continue?"
   - "This discussion has important design context. Let me save it to [file/backlog] now."

3. **After saving, confirm** what was captured so the user knows context is preserved.

## Why

Context compression can happen at any time during long conversations. Important design decisions discussed but not written down can be lost. Writing them immediately ensures they survive compression and are available in future sessions.

## What NOT to do

- Don't wait until `/retro` to capture decisions — that may be too late
- Don't save trivial or in-progress thoughts — only confirmed decisions and clear user preferences
- Don't interrupt the user's flow for minor items — use judgment on when to pause
