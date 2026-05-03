import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import HomeTabsComponent from '../components/utils/home.tabs.component.vue';

const vuetify = createVuetify();

const items = [
  { id: 'plans', label: 'Plans' },
  { id: 'units', label: 'Units' },
];

/**
 * Build a minimal router mock.
 * @param {Object} [query={}] Initial query params.
 * @returns {{ $route: Object, $router: Object }}
 */
function buildRouter(query = {}) {
  const $route = { query: { ...query } };
  const $router = { replace: vi.fn() };
  return { $route, $router };
}

/**
 * Mount HomeTabsComponent with optional router mock and props.
 * @param {Object} props Component props.
 * @param {Object} [routerQuery={}] Simulated $route.query.
 * @returns {{ wrapper, $router }}
 */
function mountComponent(props = {}, routerQuery = {}) {
  const { $route, $router } = buildRouter(routerQuery);
  const wrapper = mount(HomeTabsComponent, {
    props: { items, modelValue: 0, ...props },
    global: {
      plugins: [vuetify],
      mocks: { $route, $router },
    },
  });
  return { wrapper, $router };
}

describe('HomeTabsComponent — syncRouteQuery (D.4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── opt-in disabled (default behaviour) ──────────────────────────────────

  it('does not read route query on mount when syncRouteQuery is null (default)', async () => {
    const { wrapper } = mountComponent({ syncRouteQuery: null }, { tab: '1' });
    // modelValue must stay at 0 — no emit triggered
    const emitted = wrapper.emitted('update:modelValue');
    expect(emitted).toBeFalsy();
  });

  it('does not update router on modelValue change when syncRouteQuery is null', async () => {
    const { wrapper, $router } = mountComponent({ syncRouteQuery: null });
    await wrapper.setProps({ modelValue: 1 });
    expect($router.replace).not.toHaveBeenCalled();
  });

  // ── opt-in enabled (syncRouteQuery set) ──────────────────────────────────

  it('emits update:modelValue on mount when query param differs from modelValue', async () => {
    const { wrapper } = mountComponent({ syncRouteQuery: 'tab', modelValue: 0 }, { tab: '1' });
    const emitted = wrapper.emitted('update:modelValue');
    expect(emitted).toBeTruthy();
    expect(emitted[0][0]).toBe(1);
  });

  it('does not emit on mount when query param matches modelValue', async () => {
    const { wrapper } = mountComponent({ syncRouteQuery: 'tab', modelValue: 0 }, { tab: '0' });
    const emitted = wrapper.emitted('update:modelValue');
    expect(emitted).toBeFalsy();
  });

  it('does not emit on mount when query param is absent', async () => {
    const { wrapper } = mountComponent({ syncRouteQuery: 'tab', modelValue: 0 }, {});
    const emitted = wrapper.emitted('update:modelValue');
    expect(emitted).toBeFalsy();
  });

  it('calls router.replace when modelValue changes and syncRouteQuery is set', async () => {
    const { wrapper, $router } = mountComponent({ syncRouteQuery: 'tab', modelValue: 0 }, {});
    await wrapper.setProps({ modelValue: 1 });
    expect($router.replace).toHaveBeenCalledWith(
      expect.objectContaining({ query: expect.objectContaining({ tab: '1' }) }),
    );
  });

  it('does not call router.replace when modelValue changes and syncRouteQuery is null', async () => {
    const { wrapper, $router } = mountComponent({ syncRouteQuery: null, modelValue: 0 }, {});
    await wrapper.setProps({ modelValue: 1 });
    expect($router.replace).not.toHaveBeenCalled();
  });

  it('preserves existing query params when replacing route', async () => {
    const { wrapper, $router } = mountComponent({ syncRouteQuery: 'tab', modelValue: 0 }, { existingParam: 'keep' });
    await wrapper.setProps({ modelValue: 1 });
    expect($router.replace).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({ existingParam: 'keep', tab: '1' }),
      }),
    );
  });

  // ── out-of-range / invalid query values ──────────────────────────────────

  it('does not emit when query tab index exceeds items.length - 1', async () => {
    const { wrapper } = mountComponent({ syncRouteQuery: 'tab', modelValue: 0 }, { tab: '99' });
    const emitted = wrapper.emitted('update:modelValue');
    expect(emitted).toBeFalsy();
  });

  it('does not emit when query tab index is negative', async () => {
    const { wrapper } = mountComponent({ syncRouteQuery: 'tab', modelValue: 0 }, { tab: '-1' });
    const emitted = wrapper.emitted('update:modelValue');
    expect(emitted).toBeFalsy();
  });

  it('does not emit when query tab value is a decimal', async () => {
    const { wrapper } = mountComponent({ syncRouteQuery: 'tab', modelValue: 0 }, { tab: '0.5' });
    const emitted = wrapper.emitted('update:modelValue');
    expect(emitted).toBeFalsy();
  });
});
