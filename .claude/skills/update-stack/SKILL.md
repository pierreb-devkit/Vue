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
