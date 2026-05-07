import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent } from 'vue';
import { useLegalPage } from '../composables/useLegalPage';

const mockSources = {
  '/src/modules/legal/assets/templates/terms.template.md': async () => '# Terms\n\nWelcome to {{entity.name}} ({{entity.legalForm}}).',
  '/src/modules/legal/assets/templates/privacy.template.md': async () => '# Privacy\n\nContact: {{entity.contactEmail}}.',
  '/src/modules/legal/assets/templates/no-placeholder.template.md': async () => '# Plain\n\nNo placeholders here.',
};

const mountWith = (slug, configOverrides = {}) => {
  let api;
  const config = {
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
        ...configOverrides,
      },
    },
  };
  const Comp = defineComponent({
    async setup() { api = await useLegalPage(slug, { sources: mockSources, config }); return {}; },
    template: '<div />',
  });
  return { mount: mount(Comp, { global: { config: { globalProperties: { config } } } }), getApi: () => api };
};

describe('useLegalPage', () => {
  it('returns title and rendered HTML for valid slug', async () => {
    const { getApi } = mountWith('terms');
    await new Promise((r) => setTimeout(r, 0));
    const api = getApi();
    expect(api.title).toBe('Terms');
    expect(api.html).toContain('<h1>Terms</h1>');
  });

  it('substitutes {{entity.*}} placeholders from config', async () => {
    const { getApi } = mountWith('terms');
    await new Promise((r) => setTimeout(r, 0));
    const api = getApi();
    expect(api.html).toContain('Acme Inc');
    expect(api.html).toContain('SAS');
    expect(api.html).not.toContain('{{entity.name}}');
  });

  it('leaves placeholder literal when entity field is missing (no throw)', async () => {
    const { getApi } = mountWith('privacy', {
      entity: { name: null, legalForm: null, contactEmail: null },
    });
    await new Promise((r) => setTimeout(r, 0));
    const api = getApi();
    expect(api.html).toContain('{{entity.contactEmail}}');
  });

  it('returns notFound=true for unknown slug', async () => {
    const { getApi } = mountWith('does-not-exist');
    await new Promise((r) => setTimeout(r, 0));
    const api = getApi();
    expect(api.notFound).toBe(true);
  });

  it('returns notFound=true when item is enabled=false', async () => {
    const { getApi } = mountWith('off');
    await new Promise((r) => setTimeout(r, 0));
    const api = getApi();
    expect(api.notFound).toBe(true);
  });

  it('returns notFound=true when markdownPath does not exist in sources', async () => {
    const { getApi } = mountWith('missing');
    await new Promise((r) => setTimeout(r, 0));
    const api = getApi();
    expect(api.notFound).toBe(true);
  });

  it('does not error on placeholders without dot path', async () => {
    const { getApi } = mountWith('plain');
    await new Promise((r) => setTimeout(r, 0));
    const api = getApi();
    expect(api.html).toContain('<p>No placeholders here.</p>');
    expect(api.notFound).toBe(false);
  });
});
