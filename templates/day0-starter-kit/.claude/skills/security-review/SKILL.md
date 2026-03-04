---
name: security-review
description: "Run a security audit covering OWASP Top 10, deps, secrets, auth"
user-invocable: true
---

# /security-review — Security Audit

## Checks

### 1. Secret Scanning
Grep for patterns that should never be in code:
- API keys, tokens, passwords in source files
- `.env` files committed to git
- Hardcoded credentials in config

### 2. Dependency Vulnerabilities
```bash
npm audit
```
Flag: CRITICAL and HIGH severity.

### 3. Auth & Authorization
- RLS enabled on all user-data tables (if using Supabase/Postgres)
- UPDATE policies have `WITH CHECK` (not just `USING`)
- No privilege escalation paths

### 4. Client-Side Security
- No secrets in localStorage or client-side code
- No `dangerouslySetInnerHTML` without sanitization
- No `eval()`, `innerHTML`, or `new Function()` with user input
- CSP headers configured

### 5. Environment Variables
- No `VITE_` prefixed secrets (these are exposed to the client)
- Service keys only used server-side
- `.env.example` doesn't contain real values

### 6. Input Validation
- User input validated at system boundaries
- No SQL injection vectors (parameterized queries)
- No XSS vectors (proper escaping)

## Output Format

| # | Severity | Category | Finding | File | Recommendation |
|---|----------|----------|---------|------|---------------|
| 1 | CRITICAL | ... | ... | ... | ... |

Severity: CRITICAL / HIGH / MEDIUM / LOW / INFO
