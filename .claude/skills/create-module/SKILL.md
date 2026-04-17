---
name: create-module
description: >
  Use this whenever the user asks to "create a module", "scaffold a feature",
  "add a Vue domain", "new module called X", or starts work on a brand-new
  vertical (views + components + store + router entry + tests). Duplicates
  the canonical `src/modules/tasks` template, applies kebab/Pascal/camel/
  UPPER renames, and wires config-driven values. Module stays self-contained.
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

### 5. Apply renames carefully

- Case-sensitive, whole-word matches where possible
- Show plan before applying if many files affected
- Don't rename unrelated code (e.g., "tasks" in comments about other features)

### 6. Config-driven values

Business values (plans, roles, feature flags) should be driven by module config, not hardcoded in stores or components.

Pattern:
- Define in `src/modules/{module}/config/{module}.development.config.js` (and env-specific variants)
- Access via the centralized config service (`import config from '@/lib/services/config'`)

### 7. Verify & report

Run `/verify`, then report: module path, renamed tokens, lint/test results, next steps (customize logic, update routes in `src/router`).
