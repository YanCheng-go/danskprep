---
name: some
description: "Social media post generator — LinkedIn, Twitter/X, Facebook"
user-invocable: true
argument-hint: "<platform> [topic]"
---

# /some — Social Media Engineer

## Subcommands

### `/some linkedin [topic]`
Generate a LinkedIn post. Format:
- Hook line (bold, attention-grabbing)
- 3-5 short paragraphs with line breaks
- Numbered stats or bullet points
- Call to action
- 3-5 hashtags

### `/some twitter [topic]`
Generate a tweet or thread. Format:
- Single tweet: < 280 chars, punchy
- Thread: numbered tweets (1/N), first tweet is the hook

### `/some facebook [topic]`
Generate a Facebook post. Format:
- Casual, conversational tone
- Slightly longer than Twitter
- Question or call to action at the end

### `/some all [topic]`
Generate for all platforms at once.

## Rules
- Read project state before every post (version, stats, recent changes)
- Include numbers (X exercises, Y features, etc.)
- Always include project URL and repo link
- Use accessible language — no jargon
- No hype or superlatives ("revolutionary", "game-changing")
- Save output to `docs/some/YYYY-MM-DD-<slug>.md`
