import { describe, it, expect } from 'vitest';
import { isValidTab, resolveSurfaceTabs } from '../surface-tabs';

/**
 * isValidTab — mirrors the validation logic previously inline in admin.layout.vue.
 *
 * Accepted:
 *  - Relative path (no leading slash), non-empty, no dot segments, no whitespace, no `?` / `#`.
 *  - Legacy absolute `/admin/<something>` (still valid during migration).
 *
 * Rejected:
 *  - Missing required keys (value, label, route) or non-string route.
 *  - Whitespace, `?`, `#` in route.
 *  - Empty string, `'/'`, `'.'`, `'..'` as the whole route.
 *  - Segments of `'.'` or `'..'` anywhere in the path.
 *  - Absolute paths NOT under `/admin/`.
 */
describe('isValidTab', () => {
  // ── well-formed descriptors ──────────────────────────────────────────────
  it('accepts a relative path descriptor', () => {
    expect(isValidTab({ value: 'billing', label: 'Billing', route: 'billing' })).toBe(true);
  });

  it('accepts a descriptor with an optional icon field', () => {
    expect(isValidTab({ value: 'billing', label: 'Billing', route: 'billing', icon: 'fa-solid fa-credit-card' })).toBe(true);
  });

  it('accepts a legacy /admin/* absolute path', () => {
    expect(isValidTab({ value: 'knowledge', label: 'Knowledge', route: '/admin/knowledge' })).toBe(true);
  });

  it('accepts a nested relative path (e.g. billing/invoices)', () => {
    expect(isValidTab({ value: 'invoices', label: 'Invoices', route: 'billing/invoices' })).toBe(true);
  });

  // ── missing required fields ──────────────────────────────────────────────
  it('rejects missing value', () => {
    expect(isValidTab({ label: 'X', route: 'x' })).toBe(false);
  });

  it('rejects missing label', () => {
    expect(isValidTab({ value: 'x', route: 'x' })).toBe(false);
  });

  it('rejects missing route', () => {
    expect(isValidTab({ value: 'x', label: 'X' })).toBe(false);
  });

  it('rejects null', () => {
    expect(isValidTab(null)).toBe(false);
  });

  it('rejects a non-object (string)', () => {
    expect(isValidTab('billing')).toBe(false);
  });

  // ── route type guard ─────────────────────────────────────────────────────
  it('rejects a numeric route', () => {
    expect(isValidTab({ value: 'x', label: 'X', route: 5 })).toBe(false);
  });

  // ── whitespace / special characters ─────────────────────────────────────
  it('rejects a route containing whitespace', () => {
    expect(isValidTab({ value: 'x', label: 'X', route: 'my tab' })).toBe(false);
  });

  it('rejects a route containing ?', () => {
    expect(isValidTab({ value: 'x', label: 'X', route: 'billing?foo=1' })).toBe(false);
  });

  it('rejects a route containing #', () => {
    expect(isValidTab({ value: 'x', label: 'X', route: 'billing#section' })).toBe(false);
  });

  // ── empty / dot routes ───────────────────────────────────────────────────
  it('rejects empty string route', () => {
    expect(isValidTab({ value: 'x', label: 'X', route: '' })).toBe(false);
  });

  it('rejects route equal to "/"', () => {
    expect(isValidTab({ value: 'x', label: 'X', route: '/' })).toBe(false);
  });

  it('rejects route equal to "."', () => {
    expect(isValidTab({ value: 'x', label: 'X', route: '.' })).toBe(false);
  });

  it('rejects route equal to ".."', () => {
    expect(isValidTab({ value: 'x', label: 'X', route: '..' })).toBe(false);
  });

  // ── path traversal ───────────────────────────────────────────────────────
  it('rejects a route with a .. traversal segment', () => {
    expect(isValidTab({ value: 'x', label: 'X', route: 'billing/../secret' })).toBe(false);
  });

  it('rejects a route with a . segment', () => {
    expect(isValidTab({ value: 'x', label: 'X', route: 'billing/./secret' })).toBe(false);
  });

  // ── absolute non-admin paths ─────────────────────────────────────────────
  it('rejects an absolute path not under /admin/', () => {
    expect(isValidTab({ value: 'x', label: 'X', route: '/org/billing' })).toBe(false);
  });

  it('rejects /admin itself (no trailing slash child)', () => {
    expect(isValidTab({ value: 'x', label: 'X', route: '/admin' })).toBe(false);
  });
});

/**
 * resolveSurfaceTabs — filters by validity then by CASL `can` predicate.
 * A tab with no {action, subject} pair is always shown.
 */
describe('resolveSurfaceTabs', () => {
  const can = (action, subject) => action === 'manage' && subject === 'Organization';

  it('filters out invalid tabs', () => {
    const tabs = [
      { value: 'billing', label: 'Billing', route: 'billing' },
      { label: 'broken' },
    ];
    expect(resolveSurfaceTabs(tabs, can)).toHaveLength(1);
    expect(resolveSurfaceTabs(tabs, can)[0].value).toBe('billing');
  });

  it('filters out CASL-denied tabs', () => {
    const tabs = [
      { value: 'billing', label: 'Billing', route: 'billing', action: 'manage', subject: 'Organization' },
      { value: 'secret', label: 'Secret', route: 'secret', action: 'manage', subject: 'Nope' },
    ];
    expect(resolveSurfaceTabs(tabs, can).map((t) => t.value)).toEqual(['billing']);
  });

  it('keeps tabs with no CASL pair (always visible)', () => {
    const tabs = [{ value: 'general', label: 'General', route: 'general' }];
    expect(resolveSurfaceTabs(tabs, () => false)).toHaveLength(1);
  });

  it('keeps tabs where only action is set but subject is missing (no pair = always visible)', () => {
    const tabs = [{ value: 'x', label: 'X', route: 'x', action: 'manage' }];
    expect(resolveSurfaceTabs(tabs, () => false)).toHaveLength(1);
  });

  it('keeps tabs where only subject is set but action is missing (no pair = always visible)', () => {
    const tabs = [{ value: 'x', label: 'X', route: 'x', subject: 'Organization' }];
    expect(resolveSurfaceTabs(tabs, () => false)).toHaveLength(1);
  });

  it('handles null/undefined tabs input gracefully', () => {
    expect(resolveSurfaceTabs(null, can)).toEqual([]);
    expect(resolveSurfaceTabs(undefined, can)).toEqual([]);
  });

  it('filters invalid + CASL-denied in one pass', () => {
    const tabs = [
      { value: 'billing', label: 'Billing', route: 'billing', action: 'manage', subject: 'Organization' },
      { value: 'secret', label: 'Secret', route: 'secret', action: 'manage', subject: 'Nope' },
      { label: 'broken' },
    ];
    expect(resolveSurfaceTabs(tabs, can).map((t) => t.value)).toEqual(['billing']);
  });
});
