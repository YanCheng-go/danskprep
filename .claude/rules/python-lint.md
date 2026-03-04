# Python Lint — Ruff Rules

## When this rule applies

- **Before committing** any new or modified `.py` file in `scripts/`
- **Before pushing** to a branch with CI (GitHub Actions runs `ruff check` on all Python files)
- Run `uvx ruff check <file>` locally to catch errors before CI

## Common Ruff errors (recurring)

| Code | Error | Fix |
|------|-------|-----|
| F401 | Unused import | Remove the import. Check after refactoring if `re`, `sys`, `os` are still used |
| F841 | Variable assigned but never used | Remove the assignment, or prefix with `_` if intentionally unused |
| F541 | f-string without placeholders | Change `f"text"` to `"text"` — remove the `f` prefix |
| E741 | Ambiguous variable name (`l`, `O`, `I`) | Rename `l` → `line`, `O` → `obj`, `I` → `idx` |

## Prevention checklist

When writing or editing Python scripts:
1. Don't import modules speculatively — only import what you use
2. After removing code that used an import, delete the import too
3. Never use `l` as a variable name (looks like `1`) — use `line`, `item`, `entry`
4. Use regular strings unless you have `{expressions}` inside them

## Maintenance

Update this file when a new recurring Ruff error is encountered. Add it to the table above.
