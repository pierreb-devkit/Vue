# Migrations

Breaking changes and upgrade notes for downstream projects.

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
- **Template**: `src/config/defaults/config.myproject.js` added as a starting point for downstream projects
- **Startup warning**: the generator now warns when `NODE_ENV` is non-standard and no matching config files are found
- **Typo fixes**: `sucessColor` → `successColor` (app config), `Ressources` → `Resources` (home config) — a backward-compatible fallback is provided in `axios.js`
- **Env var prefix**: `WAOS_VUE_*` → `DEVKIT_VUE_*`

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

### Downstream project config files

Files must be named `config.{projectname}.js` — files without the `config.` prefix are silently ignored. A template is provided at `src/config/defaults/config.myproject.js`.

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
3. Rename any `{projectname}.js` config files to `config.{projectname}.js` (both in `src/config/defaults/` and `src/modules/*/config/`)
4. Update `sucessColor` → `successColor` and `Ressources` → `Resources` in your config files
5. Rename `WAOS_VUE_*` → `DEVKIT_VUE_*` in CI workflows
6. If you have **not customized** any config files, the merge will apply cleanly.
7. Run `npm run dev` to verify the generated `src/config/index.js` is correct.
8. Run `npm run lint && npm run test:unit && npm run build` to confirm everything works.
