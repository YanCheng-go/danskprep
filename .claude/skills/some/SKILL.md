---
name: some
description: Social Media Engineer — generate posts, summaries, and visual assets for sharing project updates on LinkedIn, Twitter, Facebook, etc.
user-invocable: true
argument-hint: "[platform] [topic or paste raw content]"
---

# /some — Social Media Post Generator

## When to use

When you want to share a project update, feature launch, milestone, or any content about DanskPrep on social media. This skill takes your raw notes, screenshots, or feature descriptions and produces a polished, platform-optimized post.

## Subcommand dispatch

| Invocation | Action |
|---|---|
| `/some <platform> <topic>` | Generate a post for the specified platform about the topic |
| `/some linkedin <topic>` | LinkedIn post (professional, longer, hashtags) |
| `/some twitter <topic>` | Twitter/X thread (concise, punchy, thread format) |
| `/some facebook <topic>` | Facebook post (casual, community-focused) |
| `/some all <topic>` | Generate for all platforms in one go |
| `/some update` | Auto-summarize recent changes from git log + changelog → post |
| `/some rephrase` | Rephrase whatever the user pastes into a social media post |

If no platform is specified, default to LinkedIn.

## Steps

### Step 1 — Gather content

Depending on the invocation:

**If topic/description provided:**
1. Parse the user's description for key points, features, numbers
2. Read `src/data/seed/changelog.json` for recent version highlights
3. Read `README.md` for project context and live URL

**If `/some update`:**
1. Run `git log --oneline -15` to see recent commits
2. Read `src/data/seed/changelog.json` for the latest entry
3. Read `README.md` for feature list and stats
4. Summarize the most impactful user-facing changes

**If `/some rephrase`:**
1. Take the user's pasted content as the primary source
2. Enrich with project context from README.md if helpful

### Step 2 — Identify visual assets

Check if the user provided screenshots or image references:
- If yes, note them as image slots in the post (e.g., `[Image 1: Vocabulary Drill mode]`)
- If no, suggest which features would make good screenshots
- Suggest creating a simple feature diagram if the post would benefit from one

### Step 3 — Draft the post

Apply platform-specific formatting:

**LinkedIn:**
- Hook line (first 2 lines visible before "...see more")
- 3-5 short paragraphs with line breaks between them
- Bullet points for feature lists
- Call to action (try it, contribute, share)
- 3-5 relevant hashtags at the end
- Mention: free, open source, contributions welcome
- Tone: professional but personal, share the journey

**Twitter/X:**
- Thread format: 1/ 2/ 3/ etc.
- First tweet is the hook (must stand alone)
- Each tweet under 280 chars
- Last tweet: CTA + link
- 2-3 hashtags on first tweet only

**Facebook:**
- Casual, story-driven
- Shorter than LinkedIn
- Direct CTA ("try it out", "let me know what you think")
- 1-2 hashtags max

### Step 4 — Include project links

Always include in every post:
- **Live app:** https://danskprep.vercel.app/welcome
- **GitHub:** https://github.com/YanCheng-go/danskprep
- Mention it's **free and open source**
- Mention **contributions are welcome** (content, translations, exercises)

### Step 5 — Save the post

Write the post to `docs/some/YYYY-MM-DD-<slug>.md` with this format:

```markdown
# <Post title>

**Date:** YYYY-MM-DD
**Platform:** LinkedIn / Twitter / Facebook / All
**Status:** Draft

## Post

<the actual post content, ready to copy-paste>

## Images

1. [Description of image 1] — `path/to/screenshot` or "suggested: take screenshot of X"
2. [Description of image 2] — ...

## Cross-post adaptations

### Twitter version
<if generated for all platforms>

### Facebook version
<if generated for all platforms>
```

### Step 6 — Present to user

Show the post in the conversation for review. Ask:
1. Any edits before finalizing?
2. Want versions for other platforms too?
3. Should I suggest which screenshots to attach?

## Content guidelines

- **Voice:** First person, authentic, share the learning journey
- **Focus:** What this means for Danish learners, not just technical features
- **Numbers:** Include concrete stats (292 exercises, 277 words, 7 exercise types)
- **Accessibility:** Explain technical features in learner-friendly language
  - "spaced repetition" → "it remembers what you struggle with and reviews those more often"
  - "FSRS" → "science-backed memory algorithm"
  - "cloze deletion" → "fill-in-the-blank exercises"
- **Cultural context:** Mention Prøve i Dansk, integration exams, the real need
- **Gratitude:** Acknowledge data sources, contributors, community
- **No hype:** Be genuine, not salesy. This is a personal project helping real people.

## Platform-specific tips

### LinkedIn
- First 2 lines are critical (they show before "...see more")
- Use line breaks generously (dense text gets skipped)
- Personal story angle performs well ("I'm preparing for PD3 and built this...")
- Tag relevant groups: #DanishLanguage #LearnDanish #Denmark #Integration

### Twitter/X
- Lead with the most interesting fact or visual
- Each tweet should be self-contained
- Use emoji sparingly (1-2 per tweet max)
- #LearnDanish #Danish #OpenSource

### Facebook
- More conversational, like telling a friend
- Ask questions to encourage comments
- Group-friendly format (can be posted in Danish learner groups)

## Rules

- Never fabricate features that don't exist — only mention what's in the codebase
- Always include the live URL and GitHub link
- Always mention it's free and open source
- Always mention contributions are welcome
- Use today's date for the file name
- Read README.md and changelog before every post to ensure accuracy
- Keep image descriptions specific enough that the user knows exactly what to screenshot
- Do not generate actual images — describe what screenshots to take from the live app
