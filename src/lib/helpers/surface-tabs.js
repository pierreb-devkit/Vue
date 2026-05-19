/**
 * surface-tabs — shared tab-descriptor validation and CASL filtering.
 *
 * `isValidTab` is the canonical validation function for tab entries supplied
 * via `config.admin.tabs` (and later `config.org.tabs`). It is extracted from
 * the inline method previously living in `admin.layout.vue` so downstream
 * surfaces (org-settings, future contexts) can reuse it without duplication.
 *
 * Accepted route shapes:
 *  - Relative path (preferred): `'billing'`, `'billing/invoices'` — no leading
 *    slash, non-empty, no dot segments, no whitespace, no `?` / `#`.
 *  - Legacy absolute under `/admin/`: `'/admin/billing'` — still accepted during
 *    the migration window (dev-mode warning emitted by the caller).
 *
 * Rejected:
 *  - Missing required keys (`value`, `label`, `route`) or non-string `route`.
 *  - Whitespace, `?`, `#` anywhere in the route.
 *  - Whole-route dots: `''`, `'/'`, `'.'`, `'..'`.
 *  - Segments of `'.'` or `'..'` inside a path.
 *  - Absolute paths not under `/admin/`.
 */

/**
 * Validate a single tab descriptor.
 *
 * Replicates the validation logic from `admin.layout.vue → isValidTab` exactly
 * so the admin tab-filtering output is byte-identical before and after the hoist.
 *
 * Note: dev-mode `console.warn` calls that were co-located with the inline
 * method in the Vue component are NOT reproduced here — the component still
 * owns the warning on rejection (it calls isValidTab and can warn after the
 * fact). This keeps the pure helper side-effect-free and easily testable.
 *
 * @param {unknown} tab - Raw entry from a config tabs array.
 * @returns {boolean} True if the tab should render.
 */
export function isValidTab(tab) {
  if (!tab || typeof tab !== 'object' || !tab.value || !tab.label || !tab.route) return false;
  if (typeof tab.route !== 'string') return false;
  const route = tab.route;
  // Reject whitespace, query params, or fragment identifiers.
  if (/\s/.test(route) || route.includes('?') || route.includes('#')) return false;
  // Reject degenerate whole-route values.
  if (route === '' || route === '/' || route === '.' || route === '..') return false;
  // Reject dot-traversal segments anywhere in the path.
  const segments = route.split('/');
  if (segments.some((seg) => seg === '..' || seg === '.')) return false;
  // Relative path (preferred): accept immediately.
  if (!route.startsWith('/')) return true;
  // Absolute path: only the legacy `/admin/<child>` pattern is allowed.
  if (route.startsWith('/admin/')) return true;
  return false;
}

/**
 * Filter a tabs array by validity then by CASL permissions.
 *
 * A tab with no `{action, subject}` pair is always shown (unconditional tabs).
 * Both `action` AND `subject` must be present for the CASL check to apply.
 *
 * Intended for use by surface layouts (org-settings, admin, etc.) to derive
 * their reactive extra-tab list from a config array + a `can` predicate from
 * `useAbility()`.
 *
 * @param {Array<unknown>|null|undefined} tabs - Raw tabs from config.
 * @param {(action: string, subject: string) => boolean} can - Required. CASL predicate from `useAbility()`. Must be a function.
 * @returns {Array<object>} Validated + permitted tabs.
 */
export function resolveSurfaceTabs(tabs, can) {
  if (typeof can !== 'function') throw new TypeError('[resolveSurfaceTabs] can must be a function');
  return (tabs || [])
    .filter(isValidTab)
    .filter((t) => (t.action && t.subject ? can(t.action, t.subject) : true));
}
