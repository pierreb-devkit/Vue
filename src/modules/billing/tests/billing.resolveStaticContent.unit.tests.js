// src/modules/billing/tests/billing.resolveStaticContent.unit.tests.js
import { describe, it, expect, vi, beforeEach } from 'vitest';

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

describe('billing.resolveStaticContent', () => {
  beforeEach(() => {
    for (const k of Object.keys(configMock)) delete configMock[k];
  });

  it('falls back to devkit defaults when config.billing.staticContent is absent', async () => {
    const { resolveStaticContent } = await load();
    const r = resolveStaticContent();
    expect(r.pricingMode).toBe(devkitDefaults.pricingMode);
    expect(r.plans).toEqual(devkitDefaults.plans);
    expect(r.packs).toEqual(devkitDefaults.packs);
    expect(r.faqs).toEqual(devkitDefaults.faqs);
    expect(r.signupGrant).toEqual(devkitDefaults.signupGrant);
    expect(r.tabs).toEqual(devkitDefaults.tabs);
    expect(r.header).toEqual(devkitDefaults.header);
    expect(r.halo).toEqual(devkitDefaults.halo);
  });

  it('uses config.billing.staticContent when present', async () => {
    configMock.billing = {
      staticContent: {
        pricingMode: 'subscription',
        plans: [{ id: 'x', title: 'X', features: [], meta: {} }],
        packs: [],
        faqs: { title: 'F', content: [] },
        signupGrant: { label: 'custom grant label' },
        tabs: { plans: 'P', units: 'U' },
        header: { title: 'H', subtitle: 'S' },
        halo: null,
      },
    };
    const { resolveStaticContent } = await load();
    const r = resolveStaticContent();
    expect(r.pricingMode).toBe('subscription');
    expect(r.plans[0].id).toBe('x');
    expect(r.signupGrant).toEqual({ label: 'custom grant label' });
    expect(r.header.title).toBe('H');
    expect(r.halo).toBeNull();
  });

  it('per-key fallback: missing keys in override fall back to devkit defaults', async () => {
    configMock.billing = { staticContent: { pricingMode: 'packs' } };
    const { resolveStaticContent } = await load();
    const r = resolveStaticContent();
    expect(r.pricingMode).toBe('packs');
    expect(r.plans).toEqual(devkitDefaults.plans); // fell back
  });

  it('explicit null in config wins over a non-null devkit default (presence beats nullish)', async () => {
    configMock.billing = { staticContent: { tabs: null } };
    const { resolveStaticContent } = await load();
    const r = resolveStaticContent();
    expect(r.tabs).toBeNull(); // downstream explicit null wins
    expect(r.plans).toEqual(devkitDefaults.plans); // absent key still falls back
  });

  it('structural keys (plans, packs) set to null fall back to devkit defaults (crash-safe)', async () => {
    configMock.billing = { staticContent: { plans: null, packs: null } };
    const { resolveStaticContent } = await load();
    const r = resolveStaticContent();
    expect(r.plans).toEqual(devkitDefaults.plans); // null → devkit default, not null
    expect(r.packs).toEqual(devkitDefaults.packs); // null → devkit default, not null
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
    expect(r.plans).toEqual(devkitDefaults.plans); // absent key still falls back
  });
});
