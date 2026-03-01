# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest (`main`) | ✅ |
| Older branches | ❌ |

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Please report security issues privately via GitHub's built-in security advisory feature:

1. Go to the [Security tab](https://github.com/YanCheng-go/danskprep/security)
2. Click **"Report a vulnerability"**
3. Fill in the details

You can expect an acknowledgement within **48 hours** and a resolution timeline within **7 days** for critical issues.

---

## Security Design

### Authentication
- User authentication handled entirely by **Supabase Auth** (email/password + optional OAuth)
- JWTs issued by Supabase, validated server-side on every request
- No custom auth logic — do not bypass Supabase Auth

### Data Access
- **Row Level Security (RLS) is enabled on all tables**
- Users can only read/write their own `user_cards` and `review_logs`
- `words`, `grammar_topics`, `exercises`, `sentences` are public read-only
- The Supabase service role key is never used client-side

### Environment Variables
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are the only secrets in the frontend
- The anon key is safe to expose publicly — RLS restricts what it can access
- `.env.local` is gitignored — never commit it

### OWASP Top 10 Mitigations
| Risk | Mitigation |
|------|-----------|
| Injection | Parameterised queries via Supabase JS client; no raw SQL in frontend |
| Broken Auth | Supabase Auth with JWT; RLS enforced server-side |
| Sensitive Data | No PII beyond email stored; Danish learning data is not sensitive |
| XSS | React escapes all rendered content by default; no `dangerouslySetInnerHTML` |
| Security Misconfiguration | RLS on all tables; service key never in client bundle |
| Vulnerable Components | Dependabot monitors npm + pip deps weekly |
| Insufficient Logging | Supabase dashboard provides audit logs for auth events |

### Third-Party Services
| Service | Data shared | Notes |
|---------|------------|-------|
| Supabase | Email, FSRS card state, review logs | EU-hosted instance recommended |
| Vercel | Page views, build logs | No user PII in logs |
| Vercel Analytics | Aggregated page view data | Cookieless, privacy-first |
