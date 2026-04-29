import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createVuetify } from 'vuetify';
import { useBillingStore } from '../stores/billing.store';
import BillingMeterDrawerComponent from '../components/billing.meterDrawer.component.vue';

const vuetify = createVuetify();

/**
 * Mount BillingMeterDrawerComponent with Vuetify and Pinia.
 * Stubs v-navigation-drawer (requires Vuetify layout context unavailable in unit tests)
 * and spies on store actions to prevent HTTP calls from useMeter polling.
 * @param {Object} props - Component props
 * @returns {import('@vue/test-utils').VueWrapper}
 */
const mountComponent = (props = {}) => {
  const store = useBillingStore();
  vi.spyOn(store, 'fetchUsageMeter').mockResolvedValue(null);
  vi.spyOn(store, 'fetchExtrasBalance').mockResolvedValue(null);
  return mount(BillingMeterDrawerComponent, {
    props: { modelValue: false, ...props },
    global: {
      plugins: [vuetify],
      stubs: {
        // v-navigation-drawer requires a Vuetify layout context; stub with a passthrough
        'v-navigation-drawer': {
          name: 'v-navigation-drawer',
          props: ['modelValue', 'location', 'temporary', 'width'],
          emits: ['update:modelValue'],
          template: '<div class="v-navigation-drawer-stub" v-bind="$attrs"><slot /></div>',
        },
        // Stub checkout modal to avoid Vuetify dialog/overlay visualViewport errors in unit tests
        BillingExtrasCheckoutModalComponent: {
          name: 'BillingExtrasCheckoutModalComponent',
          props: ['modelValue', 'packs'],
          emits: ['update:modelValue'],
          template: '<div class="billing-extras-checkout-modal-stub" />',
        },
      },
    },
    attachTo: document.body,
  });
};

describe('BillingMeterDrawerComponent', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  // ── Props ────────────────────────────────────────────────────────────────

  it('renders a v-navigation-drawer', () => {
    const wrapper = mountComponent();
    expect(wrapper.findComponent({ name: 'v-navigation-drawer' }).exists()).toBe(true);
  });

  it('passes modelValue to the drawer', () => {
    const wrapper = mountComponent({ modelValue: true });
    const drawer = wrapper.findComponent({ name: 'v-navigation-drawer' });
    expect(drawer.props('modelValue')).toBe(true);
  });

  it('drawer has location=right', () => {
    const wrapper = mountComponent();
    const drawer = wrapper.findComponent({ name: 'v-navigation-drawer' });
    expect(drawer.props('location')).toBe('right');
  });

  it('drawer is temporary', () => {
    const wrapper = mountComponent();
    const drawer = wrapper.findComponent({ name: 'v-navigation-drawer' });
    // Boolean prop may be passed as '' or true depending on the stub
    const temporaryVal = drawer.props('temporary');
    expect(temporaryVal === true || temporaryVal === '' || temporaryVal === 'true').toBe(true);
  });

  // ── Emits ────────────────────────────────────────────────────────────────

  it('emits update:modelValue false when close button is clicked', async () => {
    const wrapper = mountComponent({ modelValue: true });
    // Find close button by aria-label
    const closeBtn = wrapper.find('[aria-label="Close meter drawer"]');
    await closeBtn.trigger('click');
    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')[0][0]).toBe(false);
  });

  // ── Content ──────────────────────────────────────────────────────────────

  it('renders "Weekly meter" header text', () => {
    const wrapper = mountComponent({ modelValue: true });
    expect(wrapper.text()).toContain('Weekly meter');
  });

  it('renders "Breakdown" section label', () => {
    const wrapper = mountComponent({ modelValue: true });
    expect(wrapper.text()).toContain('Breakdown');
  });

  it('renders "Extra units" section label', () => {
    const wrapper = mountComponent({ modelValue: true });
    expect(wrapper.text()).toContain('Extra units');
  });

  it('renders "Buy units" CTA button', () => {
    const wrapper = mountComponent({ modelValue: true });
    expect(wrapper.text()).toContain('Buy units');
  });

  it('renders BillingMeterProgressComponent', () => {
    const wrapper = mountComponent({ modelValue: true });
    expect(wrapper.findComponent({ name: 'BillingMeterProgressComponent' }).exists()).toBe(true);
  });

  it('renders BillingMeterBreakdownChartComponent', () => {
    const wrapper = mountComponent({ modelValue: true });
    expect(wrapper.findComponent({ name: 'BillingMeterBreakdownChartComponent' }).exists()).toBe(true);
  });

  it('renders BillingExtrasCheckoutModalComponent', () => {
    const wrapper = mountComponent({ modelValue: true });
    expect(wrapper.findComponent({ name: 'BillingExtrasCheckoutModalComponent' }).exists()).toBe(true);
  });

  // ── Meter data ───────────────────────────────────────────────────────────

  it('reflects store meter values in the progress component', () => {
    const store = useBillingStore();
    store.usageMeter = { meterUsed: 400, meterQuota: 1000, extrasRemaining: 50 };
    const wrapper = mountComponent({ modelValue: true });
    const progress = wrapper.findComponent({ name: 'BillingMeterProgressComponent' });
    expect(progress.props('used')).toBe(400);
    expect(progress.props('quota')).toBe(1000);
    expect(progress.props('extras')).toBe(50);
  });

  it('reflects breakdown from store in chart component', () => {
    const store = useBillingStore();
    store.usageMeter = {
      meterUsed: 300,
      meterQuota: 1000,
      meterBreakdown: { scrap: 200, autofix: 100 },
    };
    const wrapper = mountComponent({ modelValue: true });
    const chart = wrapper.findComponent({ name: 'BillingMeterBreakdownChartComponent' });
    expect(chart.props('breakdown')).toEqual({ scrap: 200, autofix: 100 });
  });

  // ── Extras checkout modal open ────────────────────────────────────────────

  it('extras modal is closed by default', () => {
    const wrapper = mountComponent({ modelValue: true });
    expect(wrapper.vm.extrasModalOpen).toBe(false);
  });

  it('opens extras modal when "Buy units" is clicked', async () => {
    const wrapper = mountComponent({ modelValue: true });
    const buyBtn = wrapper.findAll('.v-btn').find((b) => b.text().includes('Buy units'));
    expect(buyBtn).toBeDefined();
    await buyBtn.trigger('click');
    expect(wrapper.vm.extrasModalOpen).toBe(true);
  });

  // ── packsAvailable ───────────────────────────────────────────────────────

  it('sources packsAvailable from usageMeter when available', () => {
    const store = useBillingStore();
    const packs = [{ packId: 'pack_500', label: '500 units', priceUsd: 9, meterUnits: 500 }];
    store.usageMeter = { meterUsed: 0, meterQuota: 1000, packsAvailable: packs };
    const wrapper = mountComponent({ modelValue: true });
    expect(wrapper.vm.packsAvailable).toEqual(packs);
  });

  it('falls back to extrasBalance.packsAvailable when usageMeter has none', () => {
    const store = useBillingStore();
    const packs = [{ packId: 'pack_200', label: '200 units', priceUsd: 4, meterUnits: 200 }];
    store.usageMeter = { meterUsed: 0, meterQuota: 1000 };
    store.extrasBalance = { balance: 0, packsAvailable: packs };
    const wrapper = mountComponent({ modelValue: true });
    expect(wrapper.vm.packsAvailable).toEqual(packs);
  });

  it('returns empty array when neither store has packs', () => {
    const wrapper = mountComponent({ modelValue: true });
    expect(wrapper.vm.packsAvailable).toEqual([]);
  });
});
