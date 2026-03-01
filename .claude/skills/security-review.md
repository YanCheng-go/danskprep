# Security Review (DevSecOps)

Run a security audit of the current codebase or a specific PR. Covers OWASP Top 10, dependency vulnerabilities, secret exposure, and Supabase RLS policy.

## Instructions

Run the following checks in order. Report findings with severity: `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, `INFO`.

---

### 1. Secret Scanning

Check git history and working tree for accidentally committed secrets:

```bash
# Check staged and unstaged changes for potential secrets
git diff HEAD | grep -iE "(api_key|secret|password|token|supabase_service|SUPABASE_SERVICE)" | grep -v ".example"

# Check if .env.local is tracked
git ls-files .env.local

# Verify .gitignore covers env files
grep -E "\.env" .gitignore
```

Flag any real-looking keys (not example values like `your-key-here`).

---

### 2. Dependency Vulnerabilities

```bash
# npm — check for known CVEs
npm audit --json | python3 -c "
import json, sys
data = json.load(sys.stdin)
vulns = data.get('vulnerabilities', {})
critical = [k for k,v in vulns.items() if v.get('severity') in ('critical','high')]
print(f'Critical/High: {len(critical)}')
for c in critical[:10]: print(f'  - {c}: {vulns[c][\"severity\"]}')
"

# Python scripts — check with pip-audit if available
cd scripts && uv run pip-audit 2>/dev/null || echo "pip-audit not installed (uv add --dev pip-audit to enable)"
```

---

### 3. Supabase RLS Verification

Read `supabase/migrations/001_initial_schema.sql` and verify:
- Every table has `ALTER TABLE <name> ENABLE ROW LEVEL SECURITY`
- Every table has at least one RLS policy
- `user_cards` and `review_logs` policies filter by `auth.uid()`
- Public tables (`words`, `grammar_topics`, `exercises`, `sentences`) are read-only from frontend

```bash
grep -A2 "ENABLE ROW LEVEL SECURITY" supabase/migrations/001_initial_schema.sql
grep "CREATE POLICY" supabase/migrations/001_initial_schema.sql
```

Flag any table that has RLS enabled but no policies (locks out all access), or any table missing RLS entirely.

---

### 4. Supabase Client Usage

Verify the singleton pattern is respected:

```bash
# Should find exactly 1 createClient call
grep -r "createClient" src/ --include="*.ts" --include="*.tsx"

# No service role key usage in frontend
grep -r "SERVICE" src/ --include="*.ts" --include="*.tsx"
grep -r "service_role" src/ --include="*.ts" --include="*.tsx"
```

Flag any `createClient` outside `src/lib/supabase.ts`.

---

### 5. XSS Surface

```bash
# Flag any dangerouslySetInnerHTML usage
grep -r "dangerouslySetInnerHTML" src/ --include="*.tsx"

# Flag any direct innerHTML assignment
grep -r "innerHTML" src/ --include="*.ts" --include="*.tsx"

# Flag eval / new Function usage
grep -rE "(eval\(|new Function)" src/ --include="*.ts" --include="*.tsx"
```

---

### 6. Environment Variable Exposure

```bash
# Only VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY should be exposed
grep -r "import.meta.env" src/ --include="*.ts" --include="*.tsx"

# Verify .env.example only has non-secret placeholders
cat .env.example 2>/dev/null || echo ".env.example missing"
```

Flag any `VITE_` prefixed variable that appears to be a secret (service role key, private API key).

---

### 7. Auth Flow Review (if auth code changed)

Read `src/hooks/useAuth.ts` and check:
- Session is loaded from Supabase, not localStorage manually
- `onAuthStateChange` listener is properly cleaned up
- No user ID is trusted from the client — always use `auth.uid()` in RLS

---

### Output Format

```
## Security Review — DanskPrep
Date: <today>
Scope: <PR #X / full codebase>

### CRITICAL
(none) ✓

### HIGH
- [H1] <finding>: <location> — <remediation>

### MEDIUM
- [M1] <finding>: <location> — <remediation>

### LOW / INFO
- [L1] ...

### Summary
X critical, X high, X medium, X low
Overall: ✓ Approved / ⚠ Fix before merge / ✗ Block — security issue
```

---

## Automated fix commands

If issues are found, suggest the exact fix. Common fixes:
- `npm audit fix` for low-severity dep updates
- Add missing RLS policy (provide the SQL)
- Move `createClient` call to `src/lib/supabase.ts`
- Add variable to `.gitignore` if accidentally tracked
