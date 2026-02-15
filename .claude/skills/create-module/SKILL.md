---
name: create-module
description: Create a new feature module by duplicating the canonical `tasks` module template. Use when adding a new module to the application, scaffolding a new domain area from scratch, or generating the boilerplate for a new feature.
---

# Create Module Skill

Create a new module by copying and renaming the `tasks` template module.

## Prerequisites

- The canonical template module `src/modules/tasks` must exist
- You need a name for the new module (kebab-case)

## Steps

### 1. Ask for the module name

Prompt user for the new module name in kebab-case (e.g., `my-feature`, `user-settings`)

### 2. Derive naming conventions

Follow `/naming` for the full reference. Quick summary from the module name (e.g., `my-feature`):

- **kebab-case**: `my-feature` (folder names, file prefixes, routes)
- **PascalCase**: `MyFeature` (component names in JS/templates)
- **UPPER_SNAKE_CASE**: `MY_FEATURE` (env keys, constants)
- **lowerCamelCase**: `myFeature` (variable names, function names, store exports)

### 3. Duplicate the module

```bash
cp -r src/modules/tasks src/modules/{new-module-name}
```

### 4. Rename references

Search and replace the following tokens across the new module:

- `tasks` → `{new-module-name}` (kebab-case)
- `Tasks` → `{NewModuleName}` (PascalCase)
- `TASKS` → `{NEW_MODULE_NAME}` (UPPER_SNAKE_CASE)
- `task` → `{new-module}` (singular kebab-case, if applicable)
- `Task` → `{NewModule}` (singular PascalCase, if applicable)

Files to check:

- Component names and file names
- Route paths and names
- Store/Pinia modules
- API endpoint names
- Type/interface names
- Config keys
- Test file names and test descriptions

### 5. Show rename plan (if broad changes)

If renaming affects many files, show a brief plan before applying changes.

### 6. Apply renames carefully

Use safe search+replace to avoid false positives:

- Be case-sensitive
- Match whole words where possible
- Don't rename unrelated code (e.g., "tasks" in comments about other features)

### 7. Run verify (dedicated skill)

```bash
npm run lint
npm run test:unit
```

### 8. Report results

Provide a summary:

- ✅ Module created at: `src/modules/{new-module-name}`
- ✅ Renamed tokens: `tasks` → `{new-module-name}`, etc.
- ✅ Verification: lint passed, tests passed
- 📝 Next steps: Customize the module logic, update routes in `src/router`, register in app if needed

## Example

Input: `user-profiles`

Output:

- Creates `src/modules/user-profiles/`
- Renames: `Tasks` → `UserProfiles`, `tasks` → `user-profiles`, `TASKS` → `USER_PROFILES`
- Component: `TasksList.vue` → `UserProfilesList.vue`
- Store: `tasksStore.js` → `userProfilesStore.js`
- Routes: `/tasks` → `/user-profiles`

## Notes

- Preserves the module structure from the `tasks` template
- Follows modularity rules: keeps the module independent
