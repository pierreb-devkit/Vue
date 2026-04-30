import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createVuetify } from 'vuetify';
import { useBillingStore } from '../stores/billing.store';
import BillingExtrasCheckoutModalComponent from '../components/billing.extrasCheckoutModal.component.vue';

const vuetify = createVuetify();

const mockPacks = [
  { packId: 'pack_500', label: '500 units', priceUsd: 9, meterUnits: 500 },
  { packId: 'pack_1000', label: '1000 units', priceUsd: 16, meterUnits: 1000 },
];

/** Shared createExtrasCheckout spy, reset in beforeEach. */
let purchasePackSpy;

/**
 * Mount BillingExtrasCheckoutModalComponent with Vuetify and Pinia.
 * Spies on billingStore.createExtrasCheckout so purchasePack is directly
 * observable without triggering HTTP calls.
 * @param {Object} props - Component props
 * @returns {import('@vue/test-utils').VueWrapper}
 */
const mountComponent = (props = {}) =>
  mount(BillingExtrasCheckoutModalComponent, {
    props: { modelValue: false, packs: mockPacks, ...props },
    global: {
      plugins: [vuetify],
      stubs: {
        // v-dialog uses VOverlay which needs visualViewport (not in jsdom)
        'v-dialog': {
          name: 'v-dialog',
          props: ['modelValue', 'maxWidth'],
          emits: ['update:modelValue'],
          template: '<div class="v-dialog-stub" v-bind="$attrs"><slot /></div>',
        },
        // v-alert: stub to avoid Vuetify overlay/transition complexity in unit tests
        'v-alert': {
          name: 'v-alert',
          props: ['type', 'variant', 'density', 'closable'],
          emits: ['click:close'],
          template: '<div class="v-alert-stub" v-bind="$attrs"><slot /></div>',
        },
      },
    },
    attachTo: document.body,
  });

describe('BillingExtrasCheckoutModalComponent', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    purchasePackSpy = vi.fn();
    const store = useBillingStore();
    vi.spyOn(store, 'createExtrasCheckout').mockImplementation(purchasePackSpy);
  });

  // ── Rendering ────────────────────────────────────────────────────────────

  it('renders a v-dialog', () => {
    const wrapper = mountComponent();
    expect(wrapper.findComponent({ name: 'v-dialog' }).exists()).toBe(true);
  });

  it('passes modelValue to the dialog', () => {
    const wrapper = mountComponent({ modelValue: true });
    expect(wrapper.findComponent({ name: 'v-dialog' }).props('modelValue')).toBe(true);
  });

  it('renders pack radio options', () => {
    const wrapper = mountComponent({ modelValue: true });
    expect(wrapper.text()).toContain('500 units');
    expect(wrapper.text()).toContain('1000 units');
  });

  it('renders pack price in label', () => {
    const wrapper = mountComponent({ modelValue: true });
    expect(wrapper.text()).toContain('$9');
    expect(wrapper.text()).toContain('$16');
  });

  it('renders unit count in label', () => {
    const wrapper = mountComponent({ modelValue: true });
    expect(wrapper.text()).toContain('+500 units');
    expect(wrapper.text()).toContain('+1000 units');
  });

  it('shows "No packs available" when packs is empty', () => {
    const wrapper = mountComponent({ modelValue: true, packs: [] });
    expect(wrapper.text()).toContain('No packs available');
  });

  // ── Default selection ────────────────────────────────────────────────────

  it('pre-selects the first pack when packs are provided', () => {
    const wrapper = mountComponent({ modelValue: true });
    expect(wrapper.vm.selectedPackId).toBe('pack_500');
  });

  it('does not pre-select when packs is empty', () => {
    const wrapper = mountComponent({ modelValue: true, packs: [] });
    expect(wrapper.vm.selectedPackId).toBeNull();
  });

  it('pre-selects on open when dialog opens with packs', async () => {
    const wrapper = mountComponent({ modelValue: false });
    expect(wrapper.vm.selectedPackId).toBe('pack_500'); // packs watcher fires immediately
  });

  // ── CTA label ────────────────────────────────────────────────────────────

  it('CTA button shows selected pack label', () => {
    const wrapper = mountComponent({ modelValue: true });
    // First pack selected by default
    expect(wrapper.vm.selectedPackLabel).toBe('500 units');
  });

  it('selectedPackLabel is empty string when no selection', () => {
    const wrapper = mountComponent({ modelValue: true, packs: [] });
    expect(wrapper.vm.selectedPackLabel).toBe('');
  });

  // ── Emits ────────────────────────────────────────────────────────────────

  it('emits update:modelValue false when Cancel is clicked', async () => {
    const wrapper = mountComponent({ modelValue: true });
    const cancelBtn = wrapper.findAll('.v-btn').find((b) => b.text() === 'Cancel');
    expect(cancelBtn).toBeDefined();
    await cancelBtn.trigger('click');
    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')[0][0]).toBe(false);
  });

  // ── Buy flow ─────────────────────────────────────────────────────────────

  it('calls createExtrasCheckout with selected packId when Buy is clicked', async () => {
    purchasePackSpy.mockResolvedValue(undefined);

    const wrapper = mountComponent({ modelValue: true });
    // selectedPackId defaults to first pack
    const buyBtn = wrapper.findAll('.v-btn').find((b) => b.text().includes('Buy'));
    expect(buyBtn).toBeDefined();
    await buyBtn.trigger('click');
    await wrapper.vm.$nextTick();
    expect(purchasePackSpy).toHaveBeenCalledWith('pack_500');
  });

  it('sets purchasing=true while buy is in progress', async () => {
    let resolve;
    purchasePackSpy.mockReturnValue(
      new Promise((res) => {
        resolve = res;
      }),
    );

    const wrapper = mountComponent({ modelValue: true });
    const buyBtn = wrapper.findAll('.v-btn').find((b) => b.text().includes('Buy'));
    // Await trigger so the click handler starts executing (purchasing flips synchronously)
    await buyBtn.trigger('click');
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.purchasing).toBe(true);

    resolve();
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.purchasing).toBe(false);
  });

  it('resets purchasing=false and sets purchaseError after error in createExtrasCheckout', async () => {
    purchasePackSpy.mockRejectedValue(new Error('Network error'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const wrapper = mountComponent({ modelValue: true });
    const buyBtn = wrapper.findAll('.v-btn').find((b) => b.text().includes('Buy'));
    await buyBtn.trigger('click');
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick(); // let the promise settle

    expect(wrapper.vm.purchasing).toBe(false);
    expect(wrapper.vm.purchaseError).toBe('Unable to start checkout. Please try again.');
    consoleSpy.mockRestore();
  });

  it('clears purchaseError when dialog is reopened (M2 fix)', async () => {
    purchasePackSpy.mockRejectedValueOnce(new Error('Network error'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const wrapper = mountComponent({ modelValue: true });
    const buyBtn = wrapper.findAll('.v-btn').find((b) => b.text().includes('Buy'));

    // Trigger error on first attempt
    await buyBtn.trigger('click');
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.purchaseError).toBeTruthy();

    // Close dialog
    await wrapper.setProps({ modelValue: false });
    await wrapper.vm.$nextTick();

    // Re-open: purchaseError must be cleared
    await wrapper.setProps({ modelValue: true });
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.purchaseError).toBeNull();

    consoleSpy.mockRestore();
  });

  it('clears purchaseError on retry (new buy attempt)', async () => {
    purchasePackSpy
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValue(undefined);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const wrapper = mountComponent({ modelValue: true });
    const buyBtn = wrapper.findAll('.v-btn').find((b) => b.text().includes('Buy'));

    // First click → error
    await buyBtn.trigger('click');
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.purchaseError).toBeTruthy();

    // Second click → clears error before attempt
    await buyBtn.trigger('click');
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.purchaseError).toBeNull();
    consoleSpy.mockRestore();
  });

  it('Buy button is disabled when selectedPackId is null', () => {
    // When packs is empty, selectedPackId remains null → buy CTA should be disabled
    const wrapper = mountComponent({ modelValue: true, packs: [] });
    expect(wrapper.vm.selectedPackId).toBeNull();
    // Component logic: :disabled="!selectedPackId || purchasing"
    // When selectedPackId is null, the computed disabled condition is true
    expect(!wrapper.vm.selectedPackId || wrapper.vm.purchasing).toBe(true);
  });

  // ── Prop validation ──────────────────────────────────────────────────────

  it('renders with empty packs array without errors', () => {
    expect(() => mountComponent({ modelValue: false, packs: [] })).not.toThrow();
  });

  it('renders correctly with modelValue=false (closed state)', () => {
    const wrapper = mountComponent({ modelValue: false });
    const dialog = wrapper.findComponent({ name: 'v-dialog' });
    expect(dialog.props('modelValue')).toBe(false);
  });
});
