import { describe, it, expect, vi, beforeAll } from 'vitest';

vi.mock('../views/legal.page.view.vue', () => ({ default: { name: 'LegalPageView' } }));

vi.mock('@/config', () => ({
  default: {
    legal: {
      pages: {
        enabled: false,
        routePrefix: '/legal',
        items: {
          terms:  { enabled: true,  slug: 'terms',   title: 'Terms',   markdownPath: '/p/terms.md' },
          privacy:{ enabled: true,  slug: 'privacy', title: 'Privacy', markdownPath: '/p/privacy.md' },
          off:    { enabled: false, slug: 'off',     title: 'Off',     markdownPath: '/p/off.md' },
        },
      },
    },
  },
}));

describe('legal.router', () => {
  it('exports empty array when pages.enabled is false', async () => {
    const mod = await import('../router/legal.router');
    expect(mod.default).toEqual([]);
  });
});

describe('legal.router — enabled', () => {
  beforeAll(() => {
    vi.resetModules();
    vi.doMock('@/config', () => ({
      default: {
        legal: {
          pages: {
            enabled: true,
            routePrefix: '/legal',
            items: {
              terms:  { enabled: true,  slug: 'terms',   title: 'Terms',   markdownPath: '/p/terms.md' },
              privacy:{ enabled: true,  slug: 'privacy', title: 'Privacy', markdownPath: '/p/privacy.md' },
              off:    { enabled: false, slug: 'off',     title: 'Off',     markdownPath: '/p/off.md' },
            },
          },
        },
      },
    }));
    vi.doMock('../views/legal.page.view.vue', () => ({ default: { name: 'LegalPageView' } }));
  });

  it('registers one dynamic catch-all route under routePrefix', async () => {
    const mod = await import('../router/legal.router');
    expect(mod.default).toHaveLength(1);
    expect(mod.default[0].path).toBe('/legal/:slug');
    expect(mod.default[0].name).toBe('LegalPage');
    expect(mod.default[0].meta?.footer).toBe(true);
  });
});
