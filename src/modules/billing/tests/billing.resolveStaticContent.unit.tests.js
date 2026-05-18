// src/modules/billing/tests/billing.resolveStaticContent.unit.tests.js
import { describe, it, expect, vi, beforeEach } from 'vitest';

// config is the generated runtime config; mock it per-test.
vi.mock('../../../lib/services/config.js', () => ({ default: {} }));
import configMock from '../../../lib/services/config.js';
import * as devkitDefaults from '../config/billing.static-content.js';

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
        tabs: { plans: 'P', units: 'U' },
        header: { title: 'H', subtitle: 'S' },
        halo: null,
      },
    };
    const { resolveStaticContent } = await load();
    const r = resolveStaticContent();
    expect(r.pricingMode).toBe('subscription');
    expect(r.plans[0].id).toBe('x');
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
});
