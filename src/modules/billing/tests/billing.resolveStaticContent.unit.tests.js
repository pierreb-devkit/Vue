// src/modules/billing/tests/billing.resolveStaticContent.unit.tests.js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// config is the generated runtime config; mock it per-test.
vi.mock('../../../lib/services/config.js', () => ({ default: {} }));
import configMock from '../../../lib/services/config.js';
import * as devkitDefaults from '../config/billing.static-content.js';

/**
 * @desc Reset modules and re-import the resolver so config mock changes take effect.
 * @returns {Promise<typeof import('../lib/billing.resolveStaticContent.js')>}
 */
async function load() {
  vi.resetModules();
  return import('../lib/billing.resolveStaticContent.js');
}

/**
 * @desc Devkit default plans/packs, read through the tabs that now carry them.
 * @returns {{plans: Array, packs: Array}}
 */
function devkitCollections() {
  const plans = devkitDefaults.tabs.flatMap((t) => t.plans ?? []);
  const packs = devkitDefaults.tabs.flatMap((t) => t.packs ?? []);
  return { plans, packs };
}

describe('billing.resolveStaticContent', () => {
  beforeEach(() => {
    for (const k of Object.keys(configMock)) delete configMock[k];
  });

  it('falls back to devkit defaults when config.billing.staticContent is absent', async () => {
    const { resolveStaticContent } = await load();
    const r = resolveStaticContent();
    const { plans, packs } = devkitCollections();
    expect(r.pricingMode).toBe(devkitDefaults.pricingMode);
    expect(r.tabs.map((t) => t.id)).toEqual(devkitDefaults.tabs.map((t) => t.id));
    expect(r.tabs.flatMap((t) => t.plans ?? [])).toEqual(plans);
    expect(r.tabs.flatMap((t) => t.packs ?? [])).toEqual(packs);
    expect(r.faqs).toEqual(devkitDefaults.faqs);
    expect(r.signupGrant).toEqual(devkitDefaults.signupGrant);
    expect(r.header).toEqual(devkitDefaults.header);
    expect(r.halo).toEqual(devkitDefaults.halo);
  });

  it('uses config.billing.staticContent when present', async () => {
    configMock.billing = {
      staticContent: {
        pricingMode: 'subscription',
        tabs: [{ id: 'x', label: 'X', annualToggle: true, plans: [{ id: 'x1', title: 'X1' }], packs: null }],
        faqs: { title: 'F', content: [] },
        signupGrant: { label: 'custom grant label' },
        header: { title: 'H', subtitle: 'S' },
        halo: null,
      },
    };
    const { resolveStaticContent } = await load();
    const r = resolveStaticContent();
    expect(r.pricingMode).toBe('subscription');
    expect(r.tabs).toHaveLength(1);
    expect(r.tabs[0].id).toBe('x');
    expect(r.tabs[0].plans[0].id).toBe('x1');
    expect(r.signupGrant).toEqual({ label: 'custom grant label' });
    expect(r.header.title).toBe('H');
    expect(r.halo).toBeNull();
  });

  it('per-key fallback: missing keys in override fall back to devkit defaults', async () => {
    configMock.billing = { staticContent: { pricingMode: 'packs' } };
    const { resolveStaticContent } = await load();
    const r = resolveStaticContent();
    expect(r.pricingMode).toBe('packs');
    expect(r.tabs.map((t) => t.id)).toEqual(devkitDefaults.tabs.map((t) => t.id)); // fell back
  });

  it('explicit null in config wins over a non-null devkit default for a DISPLAY-OPTIONAL key', async () => {
    configMock.billing = { staticContent: { header: null } };
    const { resolveStaticContent } = await load();
    const r = resolveStaticContent();
    expect(r.header).toBeNull(); // downstream explicit null wins
    expect(r.tabs.map((t) => t.id)).toEqual(devkitDefaults.tabs.map((t) => t.id)); // absent key still falls back
  });

  it('structural key (tabs) set to null falls back to devkit defaults (crash-safe)', async () => {
    configMock.billing = { staticContent: { tabs: null } };
    const { resolveStaticContent } = await load();
    const r = resolveStaticContent();
    expect(r.tabs.map((t) => t.id)).toEqual(devkitDefaults.tabs.map((t) => t.id));
  });

  it('tabs set to an empty array falls back to devkit defaults (a page with no tabs renders nothing)', async () => {
    configMock.billing = { staticContent: { tabs: [] } };
    const { resolveStaticContent } = await load();
    const r = resolveStaticContent();
    expect(r.tabs.map((t) => t.id)).toEqual(devkitDefaults.tabs.map((t) => t.id));
  });

  it('signupGrant set to null (or a non-object) falls back to devkit default (crash-safe)', async () => {
    configMock.billing = { staticContent: { signupGrant: null } };
    const { resolveStaticContent } = await load();
    const r = resolveStaticContent();
    expect(r.signupGrant).toEqual(devkitDefaults.signupGrant); // null → devkit default, not null
  });

  it('signupGrant override wins when present (per-key resolution, same as faqs)', async () => {
    configMock.billing = { staticContent: { signupGrant: { label: 'downstream grant label' } } };
    const { resolveStaticContent } = await load();
    const r = resolveStaticContent();
    expect(r.signupGrant).toEqual({ label: 'downstream grant label' });
    expect(r.tabs.map((t) => t.id)).toEqual(devkitDefaults.tabs.map((t) => t.id));
  });
});

// ─── resolveStaticContent — warn only when tabs was PROVIDED but unusable ────
// Regression guard: a consumer still on the pre-migration `tabs: { plans, units }`
// object shape must not silently render the devkit demo catalogue with no signal.

describe('resolveStaticContent — tabs fallback warning', () => {
  let warnSpy;

  beforeEach(() => {
    for (const k of Object.keys(configMock)) delete configMock[k];
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('warns and falls back when tabs is the pre-migration { plans, units } object shape', async () => {
    configMock.billing = { staticContent: { tabs: { plans: 'P', units: 'U' } } };
    const { resolveStaticContent } = await load();
    const r = resolveStaticContent();
    expect(r.tabs.map((t) => t.id)).toEqual(devkitDefaults.tabs.map((t) => t.id));
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(String(warnSpy.mock.calls[0][0])).toMatch(/tabs/i);
  });

  it('warns and falls back when tabs is explicitly an empty array', async () => {
    configMock.billing = { staticContent: { tabs: [] } };
    const { resolveStaticContent } = await load();
    const r = resolveStaticContent();
    expect(r.tabs.map((t) => t.id)).toEqual(devkitDefaults.tabs.map((t) => t.id));
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('does NOT warn when the tabs key is absent (regression guard against log noise)', async () => {
    configMock.billing = { staticContent: { pricingMode: 'packs' } };
    const { resolveStaticContent } = await load();
    const r = resolveStaticContent();
    expect(r.tabs.map((t) => t.id)).toEqual(devkitDefaults.tabs.map((t) => t.id));
    expect(warnSpy).not.toHaveBeenCalled();
  });
});

// ─── normalizeTabs — the single normalization site ───────────────────────────
// This is the ONLY place tab normalization is reachable: the pricing view's test
// mocks usePricing wholesale, so nothing there exercises these rules.

describe('normalizeTabs — content slots', () => {
  let warnSpy;

  beforeEach(() => {
    for (const k of Object.keys(configMock)) delete configMock[k];
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('honours a null plans slot verbatim — a packs tab NEVER inherits the devkit demo plans', async () => {
    const { normalizeTabs } = await load();
    const result = normalizeTabs(
      [{ id: 'units', label: 'Extras', plans: null, packs: [{ id: 'pk' }] }],
      devkitDefaults.tabs,
    );
    expect(result[0].plans).toBeNull();
    expect(result[0].packs).toEqual([{ id: 'pk' }]);
  });

  it('honours a null packs slot verbatim — a plans tab never inherits the devkit demo packs', async () => {
    const { normalizeTabs } = await load();
    const result = normalizeTabs(
      [{ id: 'plans', label: 'Plans', plans: [{ id: 'p' }], packs: null }],
      devkitDefaults.tabs,
    );
    expect(result[0].packs).toBeNull();
    expect(result[0].plans).toEqual([{ id: 'p' }]);
  });

  it('coerces a non-array slot to null, NOT to the devkit default', async () => {
    const { normalizeTabs } = await load();
    const result = normalizeTabs(
      [{ id: 'broken', label: 'Broken', plans: 'nonsense', packs: 42 }],
      devkitDefaults.tabs,
    );
    expect(result[0].plans).toBeNull();
    expect(result[0].packs).toBeNull();
  });

  it('warns and KEEPS THE PLANS SLOT when a tab fills both slots — never throws', async () => {
    const { normalizeTabs } = await load();
    let result;
    expect(() => {
      result = normalizeTabs(
        [{ id: 'both', label: 'Both', plans: [{ id: 'p' }], packs: [{ id: 'pk' }] }],
        devkitDefaults.tabs,
      );
    }).not.toThrow();
    expect(result[0].plans).toEqual([{ id: 'p' }]);
    expect(result[0].packs).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(String(warnSpy.mock.calls[0][0])).toMatch(/both/i);
  });

  it('treats annualToggle as display-optional — absent or falsy resolves to false', async () => {
    const { normalizeTabs } = await load();
    const result = normalizeTabs(
      [
        { id: 'a', label: 'A', plans: [], packs: null },
        { id: 'b', label: 'B', annualToggle: true, plans: [], packs: null },
      ],
      devkitDefaults.tabs,
    );
    expect(result[0].annualToggle).toBe(false);
    expect(result[1].annualToggle).toBe(true);
  });

  it('preserves config order and never throws on unusable entries', async () => {
    const { normalizeTabs } = await load();
    let result;
    expect(() => {
      result = normalizeTabs(
        [{ id: 'one', plans: [], packs: null }, null, 'nope', { id: 'two', plans: null, packs: [] }],
        devkitDefaults.tabs,
      );
    }).not.toThrow();
    expect(result.map((t) => t.id)).toEqual(['one', 'two']);
  });

  it('falls back to the devkit defaults when raw is not a usable array', async () => {
    const { normalizeTabs } = await load();
    expect(normalizeTabs(null, devkitDefaults.tabs).map((t) => t.id)).toEqual(
      devkitDefaults.tabs.map((t) => t.id),
    );
    expect(normalizeTabs('nope', devkitDefaults.tabs).map((t) => t.id)).toEqual(
      devkitDefaults.tabs.map((t) => t.id),
    );
  });
});
