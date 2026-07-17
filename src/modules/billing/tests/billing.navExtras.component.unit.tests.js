import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { useNavExtras } from '@/lib/composables/useNavExtras';

// authStoreState is a mutable hoisted object so individual tests can set
// serverConfig.billing.meterMode before mounting.
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
});
