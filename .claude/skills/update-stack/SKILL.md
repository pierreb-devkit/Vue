# Update Stack Skill

Update a downstream project with the latest changes from the Vue stack.

## What it does

Provides pure git steps for merging stack updates into downstream projects while preserving mergeability.

## Usage

Invoke this skill when you need to pull stack updates into a downstream project.

## Steps

### 1. Add the stack remote (if not already added)

```bash
git remote add vue-stack https://github.com/weareopensource/Vue.git
```

### 2. Fetch the latest stack changes

```bash
git fetch vue-stack
```

### 3. Merge the stack updates

```bash
git merge vue-stack/master
```

### 4. Handle conflicts

If conflicts occur:

- **Config files** (`.env.*`, `src/config/*`): Keep your downstream customizations
- **Core stack files** (modules, components, routes): Prefer stack changes unless you have specific customizations
- **Documentation** (`README.md`, `CLAUDE.md`): Merge both, but prefer upstream version
- **Package files** (`package.json`): Merge dependencies carefully, keep your project-specific needs and scripts

Common conflict patterns:

```bash
# View conflicts
git status

# For each conflicted file, edit and resolve
# Then mark as resolved
git add <file>

# Complete the merge
git commit
```

### 5. Run verify (dedicated skill)

## Key principles

- **Preserve mergeability**: Avoid renaming core stack files or moving them to custom locations
- **Keep stable paths**: Stack files should stay in their original locations
- **Isolate customizations**: Put project-specific code in separate files/folders when possible
- **Test thoroughly**: Always verify after merging

## Notes

- Does not invent tooling or automation
- Focuses on standard git merge workflow
