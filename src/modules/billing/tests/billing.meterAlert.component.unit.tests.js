import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { nextTick } from 'vue';

// Reactive store stand-ins so a mounted alert tracks store updates like a real Pinia store.
const { authState, billingState } = await vi.hoisted(async () => {
  const { reactive } = await import('vue');
  return {
    authState: reactive({ isLoggedIn: true, serverConfig: { billing: { meterMode: true } }, user: { currentOrganization: 'org_a' } }),
    billingState: reactive({ usageMeter: null }),
  };
});
vi.mock('../../auth/stores/auth.store', () => ({ useAuthStore: () => authState }));
vi.mock('../stores/billing.store', () => ({ useBillingStore: () => billingState }));

import BillingMeterAlert from '../components/billing.meterAlert.component.vue';

/**
 * @desc Mount the toast with reactive store stand-ins.
 * @returns {import('@vue/test-utils').VueWrapper}
 */
const mountAlert = () => shallowMount(BillingMeterAlert);

describe('billing.meterAlert.component', () => {
  beforeEach(() => {
    authState.isLoggedIn = true;
    authState.serverConfig = { billing: { meterMode: true } };
    authState.user = { currentOrganization: 'org_a' };
    billingState.usageMeter = null;
  });

  it('computes progress from the usage meter (0 without data, clamped to 100)', () => {
    const wrapper = mountAlert();
    expect(wrapper.vm.meterProgress).toBe(0);
    billingState.usageMeter = { meterUsed: 50, meterQuota: 100, weekKey: 'W1' };
    expect(mountAlert().vm.meterProgress).toBe(50);
    billingState.usageMeter = { meterUsed: 250, meterQuota: 100, weekKey: 'W1' };
    expect(mountAlert().vm.meterProgress).toBe(100);
  });

  it('shows the 80 % warning once per org and week', async () => {
    const wrapper = mountAlert();
    wrapper.vm.$options.watch.meterProgress.call(wrapper.vm, 85);
    expect(wrapper.vm.meterAlert).toMatchObject({ visible: true, color: 'warning' });
    wrapper.vm.meterAlert.visible = false;
    wrapper.vm.$options.watch.meterProgress.call(wrapper.vm, 90);
    expect(wrapper.vm.meterAlert.visible).toBe(false);
  });

  it('reacts to a live usage change on the mounted alert, once per threshold', async () => {
    billingState.usageMeter = { meterUsed: 50, meterQuota: 100, weekKey: 'W1' };
    const wrapper = mountAlert();
    expect(wrapper.vm.meterAlert.visible).toBe(false);

    billingState.usageMeter = { meterUsed: 85, meterQuota: 100, weekKey: 'W1' };
    await nextTick();
    expect(wrapper.vm.meterProgress).toBe(85);
    expect(wrapper.vm.meterAlert).toMatchObject({ visible: true, color: 'warning' });

    wrapper.vm.meterAlert.visible = false;
    billingState.usageMeter = { meterUsed: 90, meterQuota: 100, weekKey: 'W1' };
    await nextTick();
    expect(wrapper.vm.meterProgress).toBe(90);
    expect(wrapper.vm.meterAlert.visible).toBe(false);
  });

  it('shows the 100 % error and suppresses a later 80 % toast in the same week', () => {
    const wrapper = mountAlert();
    wrapper.vm.$options.watch.meterProgress.call(wrapper.vm, 100);
    expect(wrapper.vm.meterAlert).toMatchObject({ visible: true, color: 'error' });
    wrapper.vm.meterAlert.visible = false;
    wrapper.vm.$options.watch.meterProgress.call(wrapper.vm, 85);
    expect(wrapper.vm.meterAlert.visible).toBe(false);
  });

  it('stays dormant when meterMode is off or the user is signed out', () => {
    authState.serverConfig = { billing: { meterMode: false } };
    let wrapper = mountAlert();
    wrapper.vm.$options.watch.meterProgress.call(wrapper.vm, 100);
    expect(wrapper.vm.meterAlert.visible).toBe(false);

    authState.serverConfig = { billing: { meterMode: true } };
    authState.isLoggedIn = false;
    wrapper = mountAlert();
    wrapper.vm.$options.watch.meterProgress.call(wrapper.vm, 100);
    expect(wrapper.vm.meterAlert.visible).toBe(false);
  });
});
