---
name: security-review
description: Run a security audit covering OWASP Top 10, deps, secrets, RLS
user-invocable: true
---

# Security Review (DevSecOps)

Run a security audit of the current codebase or a specific PR. Covers OWASP Top 10, dependency vulnerabilities, secret exposure, and Supabase RLS policy.

## Instructions

Run the following checks in order. Report findings with severity: `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, `INFO`.

---

### 1. Secret Scanning

Check git history and working tree for accidentally committed secrets:

```bash
git diff HEAD | grep -iE "(api_key|secret|password|token|supabase_service|SUPABASE_SERVICE)" | grep -v ".example"
git ls-files .env.local
grep -E "\.env" .gitignore
```

---

### 2. Dependency Vulnerabilities

```bash
npm audit --json | python3 -c "
import json, sys
data = json.load(sys.stdin)
vulns = data.get('vulnerabilities', {})
critical = [k for k,v in vulns.items() if v.get('severity') in ('critical','high')]
print(f'Critical/High: {len(critical)}')
for c in critical[:10]: print(f'  - {c}: {vulns[c][\"severity\"]}')
"
```

---

### 3. Supabase RLS Verification

Read all migrations and verify:
- Every table has `ALTER TABLE <name> ENABLE ROW LEVEL SECURITY`
- Every table has at least one RLS policy
- `user_cards` and `review_logs` policies filter by `auth.uid()`
- Public tables are read-only from frontend

---

### 4. Supabase Client Usage

```bash
# Should find exactly 1 createClient call
grep -r "createClient" src/ --include="*.ts" --include="*.tsx"

# No service role key usage in frontend
grep -r "SERVICE" src/ --include="*.ts" --include="*.tsx"
```

---

### 5. XSS Surface

```bash
grep -r "dangerouslySetInnerHTML" src/ --include="*.tsx"
grep -r "innerHTML" src/ --include="*.ts" --include="*.tsx"
grep -rE "(eval\(|new Function)" src/ --include="*.ts" --include="*.tsx"
```

---

### 6. Environment Variable Exposure

```bash
grep -r "import.meta.env" src/ --include="*.ts" --include="*.tsx"
```

Flag any `VITE_` prefixed variable that appears to be a secret.

---

### Output Format

```
## Security Review — DanskPrep
Date: <today>
Scope: <PR #X / full codebase>

### CRITICAL
(none)

### HIGH
- [H1] <finding>: <location> — <remediation>

### MEDIUM
- [M1] <finding>: <location> — <remediation>

### LOW / INFO
- [L1] ...

### Summary
X critical, X high, X medium, X low
Overall: Approved / Fix before merge / Block — security issue
```
