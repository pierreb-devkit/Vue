import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import userProfile from '../components/user.profile.component.vue';

const vuetify = createVuetify({ components, directives });

/**
 * Mount UserProfileComponent with Vuetify, a minimal config mock, and a
 * stubbed coreAvatarUploader (avoids axios dependency in unit tests).
 * @param {object} [props={}] - Props merged into the default user prop set.
 * @returns {import('@vue/test-utils').VueWrapper} Fully mounted wrapper.
 */
const mountProfile = (props = {}) =>
  mount(userProfile, {
    global: {
      plugins: [vuetify],
      mocks: {
        config: {
          vuetify: { theme: { rounded: 'rounded-lg' } },
          api: { protocol: 'http', host: 'localhost', port: 3000, base: 'api/v1' },
        },
      },
      stubs: { coreAvatarUploader: { template: '<div class="stub-uploader"></div>' } },
    },
    props: { user: { firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com' }, ...props },
  });

describe('user.profile.component — coreAvatarUploader integration', () => {
  it('renders the coreAvatarUploader (no manual position-absolute overlay)', () => {
    const wrapper = mountProfile();
    expect(wrapper.find('.stub-uploader').exists()).toBe(true);
  });
});

describe('user.profile.component — Vuetify native labels', () => {
  it('uses Vuetify label="…" prop on every form input (no manual <label> headers)', () => {
    const wrapper = mountProfile();
    const inputs = wrapper.findAllComponents({ name: 'VTextField' });
    const labels = inputs.map((i) => i.props('label'));
    expect(labels).toContain('First Name');
    expect(labels).toContain('Last Name');
    expect(labels).toContain('Email');
    expect(labels).toContain('Position');
    const textareas = wrapper.findAllComponents({ name: 'VTextarea' });
    expect(textareas.some((t) => t.props('label') === 'Bio')).toBe(true);
  });
});

describe('user.profile.component — template hygiene (source-grep)', () => {
  it('has zero inline style attributes', () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const sfc = readFileSync(resolve(here, '../components/user.profile.component.vue'), 'utf8');
    const tmpl = sfc.split('<script>')[0];
    expect(tmpl).not.toMatch(/\bstyle\s*=\s*"/);
  });

  it('has no manual <label class="text-label-large"> headers (uses Vuetify label prop instead)', () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const sfc = readFileSync(resolve(here, '../components/user.profile.component.vue'), 'utf8');
    const tmpl = sfc.split('<script>')[0];
    expect(tmpl).not.toMatch(/<label\s+class=["'][^"']*text-label-large/);
  });
});
