import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createVuetify } from 'vuetify';
import { createI18n } from 'vue-i18n';
import BillingMeterProgressComponent from '../components/billing.meterProgress.component.vue';
import { billingEn } from '../lang/en.js';

const vuetify = createVuetify();
const i18n = createI18n({ legacy: false, globalInjection: true, locale: 'en', fallbackLocale: 'en', messages: { en: { ...billingEn } } });

/**
 * Mount BillingMeterProgressComponent with Vuetify, Pinia, and i18n installed.
 * @param {Object} props - Component props
 * @param {Object} [attrs] Component listeners/attrs.
 * @returns {import('@vue/test-utils').VueWrapper}
 */
const mountComponent = (props, attrs = {}) =>
  mount(BillingMeterProgressComponent, {
    props,
    attrs,
    global: { plugins: [vuetify, i18n] },
  });

describe('BillingMeterProgressComponent', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  // ── Progress clamping ────────────────────────────────────────────────────

  it('computes 50% progress correctly', () => {
    const wrapper = mountComponent({ used: 50, quota: 100 });
    expect(wrapper.vm.clampedProgress).toBe(50);
  });

  it('clamps progress to 0 when used is 0', () => {
    const wrapper = mountComponent({ used: 0, quota: 100 });
    expect(wrapper.vm.clampedProgress).toBe(0);
  });

  it('clamps progress to 100 when used exceeds quota', () => {
    const wrapper = mountComponent({ used: 150, quota: 100 });
    expect(wrapper.vm.clampedProgress).toBe(100);
  });

  it('clamps progress to 0 when quota is 0', () => {
    const wrapper = mountComponent({ used: 50, quota: 0 });
    expect(wrapper.vm.clampedProgress).toBe(0);
  });

  it('rounds fractional progress', () => {
    const wrapper = mountComponent({ used: 1, quota: 3 });
    expect(wrapper.vm.clampedProgress).toBe(33);
  });

  // ── Color thresholds ─────────────────────────────────────────────────────

  it('returns success color when progress is below 70%', () => {
    const wrapper = mountComponent({ used: 60, quota: 100 });
    expect(wrapper.vm.thresholdColor).toBe('success');
  });

  it('returns warning color when progress is exactly 70%', () => {
    const wrapper = mountComponent({ used: 70, quota: 100 });
    expect(wrapper.vm.thresholdColor).toBe('warning');
  });

  it('returns warning color when progress is between 70 and 90', () => {
    const wrapper = mountComponent({ used: 80, quota: 100 });
    expect(wrapper.vm.thresholdColor).toBe('warning');
  });

  it('returns error color when progress is exactly 90%', () => {
    const wrapper = mountComponent({ used: 90, quota: 100 });
    expect(wrapper.vm.thresholdColor).toBe('error');
  });

  it('returns error color when progress exceeds 90%', () => {
    const wrapper = mountComponent({ used: 99, quota: 100 });
    expect(wrapper.vm.thresholdColor).toBe('error');
  });

  // ── Click event ──────────────────────────────────────────────────────────

  it('emits click when the widget is clicked', async () => {
    const onClick = vi.fn();
    const wrapper = mountComponent({ used: 50, quota: 100 }, { onClick });
    await wrapper.find('.billing-meter-progress').trigger('click');
    expect(wrapper.emitted('click')).toHaveLength(1);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('emits click on Enter key', async () => {
    const wrapper = mountComponent({ used: 50, quota: 100 }, { onClick: vi.fn() });
    await wrapper.find('.billing-meter-progress').trigger('keydown.enter');
    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  // ── A11y attributes ──────────────────────────────────────────────────────

  it('has role=button on root element when an interactive listener is present', () => {
    const wrapper = mountComponent({ used: 50, quota: 100 }, { onClick: vi.fn() });
    expect(wrapper.find('.billing-meter-progress').attributes('role')).toBe('button');
  });

  it('does not expose button semantics when no click listener is present', async () => {
    const wrapper = mountComponent({ used: 50, quota: 100 });
    const root = wrapper.find('.billing-meter-progress');

    expect(root.attributes('role')).toBeUndefined();
    expect(root.attributes('tabindex')).toBeUndefined();

    await root.trigger('click');
    expect(wrapper.emitted('click')).toBeUndefined();
  });

  it('includes label in aria-label when label prop is provided', () => {
    const wrapper = mountComponent({ used: 50, quota: 100, label: 'Compute' });
    expect(wrapper.find('.billing-meter-progress').attributes('aria-label')).toContain('Compute');
  });

  it('includes usage stats in aria-label', () => {
    const wrapper = mountComponent({ used: 75, quota: 100 });
    expect(wrapper.find('.billing-meter-progress').attributes('aria-label')).toContain('75');
    expect(wrapper.find('.billing-meter-progress').attributes('aria-label')).toContain('100');
  });

  // ── Variant switching ────────────────────────────────────────────────────

  it('renders v-progress-linear for bar variant (default)', () => {
    const wrapper = mountComponent({ used: 50, quota: 100 });
    expect(wrapper.findComponent({ name: 'v-progress-linear' }).exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'v-progress-circular' }).exists()).toBe(false);
  });

  it('renders v-progress-circular for donut variant', () => {
    const wrapper = mountComponent({ used: 50, quota: 100, variant: 'donut' });
    expect(wrapper.findComponent({ name: 'v-progress-circular' }).exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'v-progress-linear' }).exists()).toBe(false);
  });

  // ── Extras display ───────────────────────────────────────────────────────

  it('shows extras credits in summary text when extras > 0', () => {
    const wrapper = mountComponent({ used: 50, quota: 100, extras: 30 });
    expect(wrapper.text()).toContain('+30 extras');
  });

  it('does not show extras text when extras is 0', () => {
    const wrapper = mountComponent({ used: 50, quota: 100, extras: 0 });
    expect(wrapper.text()).not.toContain('extras');
  });

  it('shows used/quota in summary text', () => {
    const wrapper = mountComponent({ used: 50, quota: 100 });
    expect(wrapper.text()).toContain('50');
    expect(wrapper.text()).toContain('100');
  });

  // ── Label ────────────────────────────────────────────────────────────────

  it('renders label when provided', () => {
    const wrapper = mountComponent({ used: 50, quota: 100, label: 'Compute usage' });
    expect(wrapper.text()).toContain('Compute usage');
  });

  it('does not render label row when label is empty', () => {
    const wrapper = mountComponent({ used: 50, quota: 100 });
    // label defaults to '' so the label row v-if is falsy
    const labelRow = wrapper.find('.d-flex.justify-space-between');
    expect(labelRow.exists()).toBe(false);
  });

  // ── Overage display ──────────────────────────────────────────────────────

  it('no overage badge when overage is 0 (normal behavior unchanged)', () => {
    const wrapper = mountComponent({ used: 50, quota: 100, overage: 0, netRemainingRaw: 50 });
    expect(wrapper.text()).not.toContain('over');
    expect(wrapper.findComponent({ name: 'v-chip' }).exists()).toBe(false);
    expect(wrapper.vm.thresholdColor).toBe('success');
  });

  it('shows overage badge and error color when overage > 0', () => {
    const wrapper = mountComponent({ used: 120, quota: 100, overage: 20, netRemainingRaw: -20 });
    expect(wrapper.vm.thresholdColor).toBe('error');
    const chip = wrapper.findComponent({ name: 'v-chip' });
    expect(chip.exists()).toBe(true);
    expect(wrapper.text()).toContain('+20 over');
    expect(wrapper.text()).toContain('-20 remaining');
  });

  it('adds aria-live regions for summary and overage updates', () => {
    const wrapper = mountComponent({ used: 120, quota: 100, overage: 20, netRemainingRaw: -20 });
    expect(wrapper.find('.billing-meter-progress__summary').attributes('aria-live')).toBe('polite');
    expect(wrapper.find('.billing-meter-progress__overage').attributes('aria-live')).toBe('assertive');
    expect(wrapper.find('.billing-meter-progress__overage').attributes('aria-atomic')).toBe('true');
  });

  it('matches the overage snapshot', () => {
    const wrapper = mountComponent({ used: 120, quota: 100, overage: 20, netRemainingRaw: -20 });
    expect(wrapper.find('.billing-meter-progress').html()).toMatchSnapshot();
  });
});
