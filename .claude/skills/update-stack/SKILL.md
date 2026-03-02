---
name: update-stack
description: Merge the latest changes from the Devkit Vue stack repository into a downstream project. Use when pulling stack updates, syncing with upstream via `git merge devkit-vue/master`, or resolving merge conflicts from stack updates.
---

# Update Stack Skill

Pure git workflow for merging stack updates while preserving downstream customizations.

## Steps

### 0. Commit downstream changes first

```bash
git status
# Commit any modified downstream files before merging to avoid confusion
```

### 1. Identify the stack remote

```bash
git remote -v
```

- If `origin` points to the stack repo → use `origin/master` everywhere below, skip adding a remote
- Otherwise:

```bash
git remote add devkit-vue https://github.com/pierreb-devkit/Vue.git
git fetch devkit-vue
```

### 2. Fetch the latest stack changes

```bash
git fetch <stack-remote>
```

### 3. Merge

```bash
git merge <stack-remote>/master
```

### 4. Handle conflicts

```bash
git status  # list conflicted files
```

**`package-lock.json`** — never resolve manually:

```bash
git checkout --theirs package-lock.json && git add package-lock.json
# After resolving package.json: npm install --package-lock-only && git add package-lock.json
```

**`ERRORS.md`** — always manually merge (union of stack entries + downstream entries, no line dropped).

**`MIGRATION.md`** (if present) — read the last entries to identify breaking changes requiring downstream module updates (see Step 6).

**Downstream-specific files** — keep both the stack fix and your customizations:
- `src/modules/app/app.router.js` (downstream routes)
- `src/config/defaults/<project>.js` (downstream-only)
- `vite.config.js`, `package.json` (merge deps, keep project specifics)

### 5. Run `/verify`

Use the `/verify` skill (lint + test + build).

### 6. Align downstream-only modules

If `MIGRATION.md` exists, read its latest entries first — they specify required changes for downstream modules.

Then diff downstream modules against the stack reference module (`src/modules/tasks`) and align any pattern drift:
- JSDoc section headers in all JS/Vue files
- `async/await + try/catch` in methods/lifecycle hooks (not `.then()/.catch()`)
- Theme via `useTheme()` composable (not `config.vuetify.theme...`)
- `console.log(err)` — no prefix strings

Run `/verify` again if changes were made.

### 7. Invoke stack-maintainer

> Ask Claude: "Run the stack-maintainer agent on the changes since the last stack merge"

## Key principles

- Preserve mergeability: keep core stack file paths stable
- Isolate customizations in separate files when possible
- Never drop downstream entries from `ERRORS.md` or `MIGRATION.md`
