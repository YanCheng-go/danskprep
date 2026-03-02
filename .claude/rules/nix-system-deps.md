# Nix & direnv — System Dependencies

## Rule: All system-level tools go through Nix

When a task requires installing a system-level application or package (CLI tools, language runtimes, database clients, etc.):

1. **Add it to `flake.nix`** under `devShells.default.packages` — never install via `brew`, `apt`, `curl | sh`, or global `npm install -g`
2. **The `.envrc` file** (`use flake`) auto-loads the Nix dev shell via `direnv` whenever you `cd` into the project — no manual `nix develop` needed
3. **After modifying `flake.nix`**, run `direnv allow` to pick up the changes (or re-enter the directory)

## Examples

```nix
# ✓ CORRECT — add to flake.nix packages list
packages = with pkgs; [
  nodejs_20
  python312
  uv
  supabase-cli    # ← system tool added here
];

# ❌ WRONG — never do any of these
# brew install supabase
# npm install -g supabase
# curl -sSL https://... | sh
```

## .envrc

The project root has an `.envrc` with `use flake`. This requires:
- `direnv` installed and hooked into the shell (`eval "$(direnv hook zsh)"` in `.zshrc`)
- One-time `direnv allow` in the project directory after cloning or after `.envrc` changes

## flake.lock

`flake.lock` is committed to the repo — it pins exact Nix package versions for reproducibility. When `flake.nix` changes, Nix updates the lock file automatically. Commit the updated `flake.lock` alongside `flake.nix`.

## When NOT to use Nix

- **npm packages** (project-level) — use `npm install` as normal; these are JS dependencies, not system tools
- **Python packages** — use `uv add`; Nix only provides the Python runtime and `uv` itself
- **Temporary one-off tools** — use `nix run nixpkgs#<package>` for a tool you need once without adding it to the flake
