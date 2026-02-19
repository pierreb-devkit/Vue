# Update Stack

Read `ERRORS.md` first and avoid repeating listed mistakes.

Merge upstream stack updates while preserving downstream customizations.

## Steps

1. **Add remote** (if not already added):
   ```bash
   git remote add devkit-vue https://github.com/pierreb-devkit/Vue.git
   ```

2. **Fetch upstream**:
   ```bash
   git fetch devkit-vue
   ```

3. **Merge**:
   ```bash
   git merge devkit-vue/master
   ```

4. **Resolve conflicts** — use these rules:
   - Config files (`.env.*`, `src/config/*`) → keep downstream customizations
   - Core stack files (modules, components, routes) → prefer upstream unless you have specific customizations
   - Docs (`README.md`, `CLAUDE.md`) → prefer upstream version
   - `package.json` → merge carefully, keep project-specific scripts and dependencies

5. **Verify**: `npm run lint`, `npm run test:unit`, `npm run build`

## Key principles

- Avoid renaming or moving core stack files — breaks future merges
- Isolate downstream customizations in separate files when possible
- Always verify after merging
