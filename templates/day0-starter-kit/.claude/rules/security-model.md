# Security Model

## Secrets & API Keys

- **Never store API keys in localStorage** — extractable via XSS
- **Never commit secrets** to git (`.env.local`, credentials, tokens)
- **Third-party API calls** go through a serverless proxy (e.g., Vercel API routes)
- Client-side code should never contain secrets — only public/anon keys

## Content Security Policy

Add CSP headers from Day 1 (via `vercel.json`, middleware, or meta tag):

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co"
        }
      ]
    }
  ]
}
```

## Database (RLS)

- Every table with user data must have Row Level Security enabled
- Public-read tables: `USING (true)` for SELECT, restricted for INSERT/UPDATE/DELETE
- User-scoped tables: `USING (auth.uid() = user_id)` on all operations
- Every UPDATE policy needs a `WITH CHECK` clause (not just `USING`)
- Test RLS: query as anonymous user and verify only expected rows return

## Rate Limiting

- Unauthenticated write endpoints (feedback, contact forms) must have rate limiting
- Options: Supabase edge functions, Vercel middleware, or DB-level constraints
- Design this alongside the feature, not as a follow-up

## Input Validation

- Validate at system boundaries (user input, external APIs)
- Sanitize HTML output — never use `dangerouslySetInnerHTML` without sanitization
- Use parameterized queries — never interpolate user input into SQL
