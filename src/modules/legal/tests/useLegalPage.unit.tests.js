import { describe, it, expect } from 'vitest';
import { useLegalPage } from '../composables/useLegalPage';

const mockSources = {
  '/src/modules/legal/assets/templates/terms.template.md': async () => '# Terms\n\nWelcome to {{entity.name}} ({{entity.legalForm}}).',
  '/src/modules/legal/assets/templates/privacy.template.md': async () => '# Privacy\n\nContact: {{entity.contactEmail}}.',
  '/src/modules/legal/assets/templates/no-placeholder.template.md': async () => '# Plain\n\nNo placeholders here.',
};

const baseConfig = (overrides = {}) => ({
  legal: {
    pages: {
      routePrefix: '/legal',
      items: {
        terms:  { enabled: true,  slug: 'terms',   title: 'Terms',   markdownPath: '/src/modules/legal/assets/templates/terms.template.md' },
        privacy:{ enabled: true,  slug: 'privacy', title: 'Privacy', markdownPath: '/src/modules/legal/assets/templates/privacy.template.md' },
        plain:  { enabled: true,  slug: 'plain',   title: 'Plain',   markdownPath: '/src/modules/legal/assets/templates/no-placeholder.template.md' },
        missing:{ enabled: true,  slug: 'missing', title: 'Missing', markdownPath: '/src/missing.md' },
        off:    { enabled: false, slug: 'off',     title: 'Off',     markdownPath: '/src/modules/legal/assets/templates/terms.template.md' },
      },
      entity: { name: 'Acme Inc', legalForm: 'SAS', contactEmail: 'hi@acme.io' },
      ...overrides,
    },
  },
});

describe('useLegalPage', () => {
  it('returns title and rendered HTML for valid slug', async () => {
    const api = await useLegalPage('terms', { sources: mockSources, config: baseConfig() });
    expect(api.title).toBe('Terms');
    expect(api.html).toContain('<h1>Terms</h1>');
  });

  it('substitutes {{entity.*}} placeholders from config', async () => {
    const api = await useLegalPage('terms', { sources: mockSources, config: baseConfig() });
    expect(api.html).toContain('Acme Inc');
    expect(api.html).toContain('SAS');
    expect(api.html).not.toContain('{{entity.name}}');
  });

  it('leaves placeholder literal when entity field is missing (no throw)', async () => {
    const api = await useLegalPage('privacy', {
      sources: mockSources,
      config: baseConfig({ entity: { name: null, legalForm: null, contactEmail: null } }),
    });
    expect(api.html).toContain('{{entity.contactEmail}}');
  });

  it('returns notFound=true for unknown slug', async () => {
    const api = await useLegalPage('does-not-exist', { sources: mockSources, config: baseConfig() });
    expect(api.notFound).toBe(true);
  });

  it('returns notFound=true when item is enabled=false', async () => {
    const api = await useLegalPage('off', { sources: mockSources, config: baseConfig() });
    expect(api.notFound).toBe(true);
  });

  it('returns notFound=true when markdownPath does not exist in sources', async () => {
    const api = await useLegalPage('missing', { sources: mockSources, config: baseConfig() });
    expect(api.notFound).toBe(true);
  });

  it('does not error on placeholders without dot path', async () => {
    const api = await useLegalPage('plain', { sources: mockSources, config: baseConfig() });
    expect(api.html).toContain('<p>No placeholders here.</p>');
    expect(api.notFound).toBe(false);
  });

  it('strips XSS payloads from rendered markdown', async () => {
    const xssSources = {
      '/src/xss.md': async () => '# XSS Test\n\n<img src="x" onerror="alert(1)">',
    };
    const xssConfig = baseConfig({
      items: {
        xss: { enabled: true, slug: 'xss', title: 'XSS', markdownPath: '/src/xss.md' },
      },
    });
    const api = await useLegalPage('xss', { sources: xssSources, config: xssConfig });
    expect(api.notFound).toBe(false);
    expect(api.html).not.toContain('onerror');
  });
});
