---
name: update-stack
description: Merge the latest changes from the Devkit Vue stack repository into a downstream project. Use when pulling stack updates, syncing with upstream via `git merge devkit-vue/master`, or resolving merge conflicts from stack updates.
---

# Update Stack Skill

Two-phase workflow. Phase 1 brings the stack down ISO. Phase 2 aligns the project.

## Phase 1 — ISO merge

**Goal: stack modules exit this phase identical to upstream. Zero downstream logic in them.**

Stack modules: `home`, `auth`, `users`, `tasks`, `core`, `app`

### 1. Setup remote + merge

```bash
git remote get-url devkit-vue >/dev/null 2>&1 || git remote add devkit-vue https://github.com/pierreb-devkit/Vue.git
git fetch devkit-vue
git merge devkit-vue/master
```

### 2. Resolve conflicts

| File | Rule |
|------|------|
| Stack module (`src/modules/home\|auth\|users\|tasks\|core\|app`) | `git checkout --theirs <file>` |
| `package-lock.json` | `git checkout --theirs package-lock.json` — regenerate after `package.json` is resolved |
| `ERRORS.md` | Union merge — keep every line from both sides, never drop |
| `MIGRATION.md` (if present) | Read it (needed for Phase 2), then `git checkout --theirs` |
| `src/modules/app/app.router.js` | `--ours` then merge stack changes manually |
| `src/config/defaults/<project>.js` | `--ours` (downstream-only file) |
| `vite.config.js`, `package.json` | `--ours` then merge upstream version bumps |

After resolving `package.json`:

```bash
npm install --package-lock-only
git add package-lock.json
```

### 3. `/verify`

All failures here are regressions from conflict resolution. Fix before Phase 2.

---

## Phase 2 — Project alignment

**Goal: project-specific modules work and match stack patterns.**

### 4. Apply MIGRATION.md (if present)

Read the last entries — they list breaking changes requiring updates in project modules. Apply each one to non-stack modules.

### 5. Align project modules

Diff project modules against `src/modules/tasks` (stack reference). Fix pattern drift per `ERRORS.md`:

- `async/await + try/catch` in methods and lifecycle hooks
- `useTheme()` composable for theme access
- JSDoc on all functions

### 6. `/verify`
