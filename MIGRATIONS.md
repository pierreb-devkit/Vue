# Migrations

Breaking changes and upgrade notes for downstream projects.

---

## Downstream config naming convention & typo fixes (2026-03-09)

### Config naming convention

Downstream projects must name their config files `config.{projectname}.js` (not just `{projectname}.js`). The generator only discovers files matching `config.${NODE_ENV}.js` — files without the `config.` prefix are silently ignored.

A template file `src/config/defaults/config.myproject.js` is now included in the stack. Copy and rename it for your project.

The generator now warns when `NODE_ENV` is set to a non-standard value and no matching config files are found.

### Typo fixes (breaking for downstream)

- `sucessColor` → `successColor` in `src/modules/app/config/config.development.js`
- `Ressources` → `Resources` in `src/modules/home/config/config.development.js`

The `axios` service includes a backward-compatible fallback (`config.vuetify.theme.snackbar.successColor ?? config.vuetify.theme.snackbar.sucessColor`), but downstream projects should update their config files to use the corrected key names.

### Migration note

If your CI workflows still reference `WAOS_VUE_*` environment variables, rename them to `DEVKIT_VUE_*`.

### Steps for downstream projects

1. Rename any `{projectname}.js` config files to `config.{projectname}.js` (both in `src/config/defaults/` and `src/modules/*/config/`)
2. Update `sucessColor` → `successColor` in your config files
3. Update `Ressources` → `Resources` in your config files
4. Rename `WAOS_VUE_*` → `DEVKIT_VUE_*` in CI workflows
5. Run `npm run dev` to verify the generated config is correct

---

## Header "float" scroll mode (2026-03-08)

New header scroll mode: the navbar shrinks to a floating pill on scroll.

To activate, set in `src/modules/app/config/config.development.js` → `vuetify.theme.header`:

```js
scrollBehavior: 'float',
colorMode: null,
```

The development defaults now ship with `'float'` enabled. To restore the previous behavior, set:

```js
scrollBehavior: 'hide',
colorMode: 'light',
opacity: undefined,
```

---

## Configuration split by module (2026-03-07)

The monolithic `src/config/defaults/development.js` has been split into per-module config files with a homogeneous naming convention.

### What changed

- **Renamed**: `development.js` → `config.development.js`, `production.js` → `config.production.js`, `test.js` → `config.test.js`
- **Extracted**: module-specific config into `src/modules/<name>/config/config.development.js`
- **Updated**: `scripts/generateConfig.js` now globs module configs and merges them in layers
- **Standalone env files**: `config.production.js` and `config.test.js` no longer import `development.js` — they export only their overrides

### New file layout

```text
src/config/defaults/
  config.development.js          ← core only (app, api, port, cookie, analytics, whitelists)
  config.production.js           ← production overrides (standalone)
  config.test.js                 ← test overrides (standalone)

src/modules/app/config/
  config.development.js          ← vuetify, header, footer, pages

src/modules/auth/config/
  config.development.js          ← sign, oAuth

src/modules/home/config/
  config.development.js          ← home sections (hero, features, gallery, etc.)
```

### Merge order (priority ascending)

1. Module defaults — `modules/*/config/config.development.js`
2. Global defaults — `config/defaults/config.development.js`
3. Module env overrides — `modules/*/config/config.${NODE_ENV}.js` (if NODE_ENV ≠ development)
4. Global env overrides — `config/defaults/config.${NODE_ENV}.js` (if NODE_ENV ≠ development)
5. `DEVKIT_VUE_*` environment variables

### Custom environments

Create `NODE_ENV=staging` by adding any of:
- `config/defaults/config.staging.js` (global overrides)
- `modules/home/config/config.staging.js` (module-level overrides)

No file is required — only modules that define a `config.<env>.js` will be overridden.

### Steps for downstream projects

1. If you have **customized** `src/config/defaults/development.js`:
   - Move `home.*` keys → `src/modules/home/config/config.development.js`
   - Move `vuetify.*`, `header.*`, `footer.*`, `pages.*` keys → `src/modules/app/config/config.development.js`
   - Move `sign.*`, `oAuth.*` keys → `src/modules/auth/config/config.development.js`
   - Keep only `app`, `port`, `api`, `cookie`, `analytics`, `whitelists` in the global file
   - Rename the file to `config.development.js`
2. If you have **customized** `production.js` or `test.js`:
   - Rename to `config.production.js` / `config.test.js`
   - Remove the `import ... from './development.js'` and `merge()` wrapper — just export the override object directly
3. If you have **not customized** any config files, the merge will apply cleanly.
4. Run `npm run dev` to verify the generated `src/config/index.js` is correct.
5. Run `npm run lint && npm run test:unit && npm run build` to confirm everything works.
