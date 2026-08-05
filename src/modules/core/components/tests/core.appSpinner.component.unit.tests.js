import { describe, it, expect, vi, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

// The default/fallback contract certified by this file must hold regardless of
// whatever `ui.loader.component` the REAL generated config resolves to for
// whoever runs this suite (bare stack today, a consumer's own build tomorrow).
// Isolate natively by mocking the config service to an empty loader — hoisted
// above the import below, so `resolveLoaderComponent`'s module-scope wiring
// (`configuredLoaderPath` / `resolvedLoader`) always sees `null` here — a
// consumer inheriting this file needs no local copy of this isolation.
vi.mock('../../../../lib/services/config.js', () => ({ default: { ui: { loader: { component: null } } } }));

import CoreAppSpinner, { resolveLoaderComponent } from '../core.appSpinner.component.vue';

/**
 * Vuetify instance with all components registered for component mount.
 * @returns {import('vuetify').Vuetify}
 */
const makeVuetify = () => createVuetify({ components, directives });

/**
 * Mount CoreAppSpinner with sensible defaults; callers override via opts.
 * @param {object} [opts]
 * @returns {import('@vue/test-utils').VueWrapper}
 */
const mountIt = (opts = {}) =>
  mount(CoreAppSpinner, {
    props: opts.props,
    attrs: opts.attrs,
    global: {
      plugins: [makeVuetify()],
    },
  });

describe('CoreAppSpinner — default rendering (isolated from any configured loader)', () => {
  it('renders the built-in v-progress-circular with indeterminate=true', () => {
    const wrapper = mountIt();
    const spinner = wrapper.findComponent({ name: 'VProgressCircular' });
    expect(spinner.exists()).toBe(true);
    expect(spinner.props('indeterminate')).toBe(true);
  });
});

describe('CoreAppSpinner — attribute fallthrough (isolated from any configured loader)', () => {
  it('forwards color/size/data-test to the rendered root (single-root branches, no declared visual props)', () => {
    const wrapper = mountIt({ attrs: { color: 'primary', size: '48', 'data-test': 'x' } });
    const spinner = wrapper.findComponent({ name: 'VProgressCircular' });
    expect(spinner.props('color')).toBe('primary');
    expect(spinner.props('size')).toBe('48');
    expect(wrapper.attributes('data-test')).toBe('x');
  });
});

describe('CoreAppSpinner — override via loader prop', () => {
  it('renders the provided loader component instead of the built-in spinner', () => {
    const wrapper = mountIt({
      props: { loader: { template: '<div class="custom-loader" />' } },
    });
    expect(wrapper.find('.custom-loader').exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'VProgressCircular' }).exists()).toBe(false);
  });
});

describe('resolveLoaderComponent — pure resolver', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns null when the configured path is unset', () => {
    expect(resolveLoaderComponent({}, null)).toBeNull();
    expect(resolveLoaderComponent({}, undefined)).toBeNull();
    expect(resolveLoaderComponent({}, '')).toBeNull();
  });

  it('warns and returns null when the path has no glob match (fail-soft)', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = resolveLoaderComponent({}, '/src/modules/x/components/x.loader.component.vue');
    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('returns the matched glob loader for a known key', () => {
    const key = '/src/modules/x/components/x.loader.component.vue';
    const globMap = { [key]: () => Promise.resolve({ default: { template: '<div class="x" />' } }) };
    const result = resolveLoaderComponent(globMap, key);
    expect(result).toBe(globMap[key]);
    expect(typeof result).toBe('function');
  });
});
