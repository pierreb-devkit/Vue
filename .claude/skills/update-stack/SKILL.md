---
name: update-stack
description: >
  Use this whenever a downstream Vue project needs to absorb upstream Devkit
  Vue changes — triggers on "update stack", "sync with devkit", "merge
  upstream", "pull stack updates", "resolve stack conflicts". Two-phase: ISO
  merge (stack modules stay byte-identical to upstream) then project
  alignment (apply MIGRATIONS.md, diff project modules vs `tasks` reference,
  /verify). Stack-code failures get an issue on `pierreb-devkit/Vue`.
---

# Update Stack Skill

Two-phase workflow. Phase 1 brings the stack down ISO. Phase 2 aligns the project.

## Phase 1 — ISO merge

**Goal: stack modules exit this phase identical to upstream. Zero downstream logic in them.**

Stack modules: `home`, `auth`, `users`, `tasks`, `core`, `app`, `secure`

### 1. Setup remote + merge

```bash
git remote get-url devkit-vue >/dev/null 2>&1 || git remote add devkit-vue https://github.com/pierreb-devkit/Vue.git
git fetch devkit-vue
git merge devkit-vue/master
```

### 2. Resolve conflicts

| File | Rule |
|------|------|
| `src/modules/app/app.router.js` | `git checkout --ours src/modules/app/app.router.js` then merge stack route changes manually — this file always contains downstream routes |
| Other stack module files (`src/modules/home`, `auth`, `users`, `tasks`, `core`, `app`, `secure`) | `git checkout --theirs <file>` |
| `package-lock.json` | `git checkout --theirs package-lock.json` — regenerate after `package.json` is resolved |
| `ERRORS.md` | Merge stack entries + project entries — never drop lines |
| `MIGRATIONS.md` (if present) | Read it (needed for Phase 2), then `git checkout --theirs MIGRATIONS.md` |
| `src/config/defaults/<project>.js` | `git checkout --ours src/config/defaults/<project>.js` (downstream-only file) |
| `vite.config.js` | `git checkout --ours vite.config.js` then merge upstream changes manually |
| `package.json` | `git checkout --ours package.json` then merge upstream version bumps |
| Downstream-only new files (new modules, helpers, composables, lib additions) | Never delete — these do not exist in the stack, `git checkout --ours <file>` if flagged |

After resolving `package.json`, regenerate the lockfile with a **full install** (not `--package-lock-only`):

```bash
rm -rf node_modules package-lock.json
npm install
git add package-lock.json
```

**Why full install, not `npm install --package-lock-only`:** `--package-lock-only` writes the lockfile without actually installing, so platform-specific optional peer deps (e.g. `@emnapi/core` on darwin) can be omitted from the top-level lockfile tree. The lockfile looks fine locally but `npm ci` on the linux CI runner fails with `Missing: @emnapi/core@X.Y.Z from lock file`. A full `npm install` resolves the cross-platform optional dep tree correctly and validates the install in one go. Do not "optimize" this back to `--package-lock-only`.

Stage all resolved files and complete the merge:

```bash
git add -u
git merge --continue
```

### 3. `/verify`

Failures typically indicate regressions from conflict resolution — fix these before Phase 2. However, if failures originate from stack module code itself (see 3bis), report them upstream.

### 3bis. Report stack issues

If `/verify` failures originate from **stack module code** (`home`, `auth`, `users`, `tasks`, `core`, `app`, `secure`) and not from conflict resolution mistakes, open a GitHub issue on `pierreb-devkit/Vue`.

**How to determine the failure origin:**
- **Stack code failure:** error occurs in unmodified stack module files (resolved with `--theirs`)
- **Conflict resolution mistake:** error occurs in files you manually merged or in downstream-only modules

**Create the issue:**

```bash
gh issue create \
  --repo pierreb-devkit/Vue \
  --title "fix(scope): <short description>" \
  --body "$(cat <<'BODY'
## Problem
<failing command output>

## Affected file(s)
<list>

## Steps to reproduce
<steps>
BODY
)" \
  --label "Fix"
```

Proceed to Phase 2 and track the upstream fix separately — do not block downstream alignment on it.

### 3ter. Block on drift

After `/verify` passes, run a final diff sweep before starting Phase 2. Any shared non-test stack file that diverges from upstream blocks the flow. No ledger exception (user decision 2026-06-02 — drift must never happen, not be documented).

```bash
git fetch devkit-vue master --quiet

drift_found=0
while IFS= read -r f; do
  upstream_blob=$(git ls-tree devkit-vue/master -- "$f" 2>/dev/null | awk '{print $3}')
  [ -z "$upstream_blob" ] && continue  # downstream-only file — skip
  local_blob=$(git rev-parse "HEAD:$f" 2>/dev/null)
  if [ "$upstream_blob" != "$local_blob" ]; then
    echo "BLOCK: drift on shared stack file: $f"
    echo "  Fix A — revert to upstream: git checkout devkit-vue/master -- $f"
    echo "  Fix B — promote upstream:   open a devkit PR with the change, merge, /update-stack here"
    echo "  Fix C — relocate:           move logic to a downstream-only module or src/config/defaults/<project>.config.js"
    drift_found=1
  fi
done < <(git ls-files src/modules src/lib src/config 2>/dev/null \
  | grep -vE "/(tests|__tests__)/" | grep -vE "\.(test|spec)\.(js|jsx|ts|tsx|vue)$")

[ "$drift_found" -eq 1 ] && exit 1
echo "3ter: no drift — OK"
```

**Rules:**
- Block on ANY shared-file divergence. No "declare and skip" path — the `DOWNSTREAM_PATCHES.md` ledger model was abandoned 2026-06-02 (memory `feedback_no_dev_in_shared_modules`).
- Scan covers the full stack tree (`src/modules`, `src/lib`, `src/config`) — auto-discovers every shared module. Per-file `git ls-tree` on upstream filters downstream-only files.
- Test files (`/tests*/`, `/__tests__/`, `*.test.*`, `*.spec.*`) are excluded — downstream test adaptations are acceptable.
- `src/modules/app/app.router.js` historically diverged on every downstream (downstream routes). Under no-ledger this must be refactored: keep `app.router.js` stack-iso and register downstream routes from a downstream-only module (e.g. `src/modules/{project}/{project}.router.js` plugged via `app.router.js`'s extension hook). Until refactored, this gate will BLOCK on every Vue downstream `/update-stack`.
- This gate runs **after** `/verify` (never blocks on transient verify failures) and **before** Phase 2 (failure is recoverable — no merge commit yet).
- Ref: plan `2026-05-30-trawl-devkit-perfect-alignment.md` Tasks E.1 + E.2.

---

## Phase 2 — Project alignment

**Goal: project-specific modules work and match stack patterns.**

### 4. Apply MIGRATIONS.md (if present)

Read the last entries — they list breaking changes requiring updates in project modules. Apply each one to non-stack modules.

### 5. Align project modules

Diff project modules against `src/modules/tasks` (stack reference). Fix any pattern drift flagged by `ERRORS.md`.

### 6. `/verify`

---

### Red flag: conflicts in `src/main.js`

`src/main.js` is stack-managed. If `/update-stack` reports a conflict here, do NOT keep the downstream side via `--ours`. Instead:

1. List the downstream-only lines:

   ```bash
   # Show the actual downstream-only lines that exist locally but not in upstream stack
   git diff devkit-vue/master..HEAD -- src/main.js
   # (alternatively, check the conflict markers left by the merge)
   git log --oneline -- src/main.js | head -10
   ```

2. Move each downstream-only side-effect (`import './modules/.../foo.css'`, posthog/sentry init, custom plugin install) into a project-owned entry — typically `src/modules/{project}/views/{project}.view.vue` (preferred) or a downstream-only module index imported from there.
3. Take the upstream version of `src/main.js` (`git checkout --theirs src/main.js`) once the migrations are committed.
4. Add a regression note to `DOWNSTREAM_PATCHES.md` if the migration is non-obvious.

This protects against the silent visual / analytics regressions seen in `comes-io/trawl_vue#856` (per-card mesh/grain CSS wiped on stack sync).
