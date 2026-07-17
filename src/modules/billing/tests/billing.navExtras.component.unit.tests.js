import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { reactive } from 'vue';
import { mount, flushPromises } from '@vue/test-utils';
import { useNavExtras } from '@/lib/composables/useNavExtras';

// authStoreState is a mutable hoisted object so individual tests can set
// serverConfig.billing.meterMode before mounting. `vi.hoisted`'s factory runs
// before this file's own imports are initialized, so it must stay import-free
// — the reactive-after-mount tests below instead assign a `reactive()`-wrapped
// `serverConfig` value (built from the regular top-level `reactive` import) so
// mutating its nested props post-mount is tracked by the component's
// `computed`/`watch`, the same way the real Pinia-backed store would be.
const authStoreState = vi.hoisted(() => ({ serverConfig: null }));
vi.mock('../../auth/stores/auth.store', () => ({
  useAuthStore: () => authStoreState,
}));

import BillingNavExtras from '../components/billing.navExtras.component.vue';

describe('billing.navExtras.component — registry behavior', () => {
  beforeEach(() => {
    const { extras } = useNavExtras();
    extras.value = [];
    authStoreState.serverConfig = null;
  });

  afterEach(() => {
    const { extras } = useNavExtras();
    extras.value = [];
  });

  it('registers the compute gauge when meterMode is true', async () => {
    authStoreState.serverConfig = { billing: { meterMode: true } };
    mount(BillingNavExtras);
    await flushPromises();
    const { extras } = useNavExtras();
    expect(extras.value.find((e) => e._id === 'billing-nav-compute-gauge')).toBeTruthy();
  });

  it('does not register when meterMode is false', async () => {
    authStoreState.serverConfig = { billing: { meterMode: false } };
    mount(BillingNavExtras);
    await flushPromises();
    const { extras } = useNavExtras();
    expect(extras.value.find((e) => e._id === 'billing-nav-compute-gauge')).toBeUndefined();
  });

  it('does not register when serverConfig has no billing key', async () => {
    authStoreState.serverConfig = {};
    mount(BillingNavExtras);
    await flushPromises();
    const { extras } = useNavExtras();
    expect(extras.value.find((e) => e._id === 'billing-nav-compute-gauge')).toBeUndefined();
  });

  it('unregisters the gauge on unmount', async () => {
    authStoreState.serverConfig = { billing: { meterMode: true } };
    const wrapper = mount(BillingNavExtras);
    await flushPromises();
    const { extras } = useNavExtras();
    expect(extras.value.find((e) => e._id === 'billing-nav-compute-gauge')).toBeTruthy();
    wrapper.unmount();
    expect(extras.value.find((e) => e._id === 'billing-nav-compute-gauge')).toBeUndefined();
  });

  it('registers the gauge when meterMode flips false→true AFTER mount (reactive watch, not just immediate-on-mount)', async () => {
    authStoreState.serverConfig = reactive({ billing: { meterMode: false } });
    mount(BillingNavExtras);
    await flushPromises();
    const { extras } = useNavExtras();
    expect(extras.value.find((e) => e._id === 'billing-nav-compute-gauge')).toBeUndefined();

    authStoreState.serverConfig.billing.meterMode = true;
    await flushPromises();
    expect(extras.value.find((e) => e._id === 'billing-nav-compute-gauge')).toBeTruthy();
  });

  it('unregisters the gauge when meterMode flips true→false AFTER mount (reactive watch)', async () => {
    authStoreState.serverConfig = reactive({ billing: { meterMode: true } });
    mount(BillingNavExtras);
    await flushPromises();
    const { extras } = useNavExtras();
    expect(extras.value.find((e) => e._id === 'billing-nav-compute-gauge')).toBeTruthy();

    authStoreState.serverConfig.billing.meterMode = false;
    await flushPromises();
    expect(extras.value.find((e) => e._id === 'billing-nav-compute-gauge')).toBeUndefined();
  });
});
