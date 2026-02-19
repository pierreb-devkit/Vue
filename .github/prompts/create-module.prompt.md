# Create Module

Read `ERRORS.md` first and avoid repeating listed mistakes.

Create a new module by duplicating the canonical `tasks` module template.

## Steps

1. **Ask and confirm** the new module name in kebab-case (e.g., `my-feature`)

2. **Derive naming conventions** from the module name:
   - `kebab-case` → folder names, file prefixes, route paths
   - `PascalCase` → component names in JS/templates
   - `lowerCamelCase` → variable names, store export (`use<Module>Store`)

3. **Duplicate the template**:
   ```bash
   cp -r src/modules/tasks src/modules/<new-module>
   ```

4. **Search and replace** across the new module:
   - `tasks` → `<new-module>` (kebab)
   - `Tasks` → `<NewModule>` (Pascal)
   - `task` → `<new-module-singular>` (singular kebab, if applicable)
   - `Task` → `<NewModuleSingular>` (singular Pascal, if applicable)

5. **File naming**: `{module}.{name}.{type}.vue` or `{module}.{type}.js`

6. **Verify**: `npm run lint`, `npm run test:unit`

## Guardrails

- Keep the new module isolated — no cross-module imports
- Do not rename or move files outside the new module
