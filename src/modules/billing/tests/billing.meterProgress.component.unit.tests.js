import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createVuetify } from 'vuetify';
import BillingMeterProgressComponent from '../components/billing.meterProgress.component.vue';

const vuetify = createVuetify();

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
    global: { plugins: [vuetify] },
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

  it('shows extras credits in summary text when extras > 0 (as "+N compute" chip)', () => {
    const wrapper = mountComponent({ used: 50, quota: 100, extras: 30 });
    // Task 4: extras shown as "+30 compute" chip (not "+30 extras" anymore)
    expect(wrapper.text()).toContain('+30 compute');
  });

  it('does not show extras chip when extras is 0', () => {
    const wrapper = mountComponent({ used: 50, quota: 100, extras: 0 });
    expect(wrapper.text()).not.toContain('extras');
    expect(wrapper.text()).not.toContain('compute');
  });

  it('shows percentage in summary text (not raw used/quota)', () => {
    const wrapper = mountComponent({ used: 50, quota: 100 });
    // Task 4: primary value is % — summary shows "50%", not raw "50 / 100"
    expect(wrapper.text()).toContain('50%');
    expect(wrapper.text()).not.toContain('50 / 100');
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

  it('shows error color and tooltip icon when overage > 0 (no chip in summary)', () => {
    const wrapper = mountComponent({ used: 120, quota: 100, overage: 20, netRemainingRaw: -20 });
    expect(wrapper.vm.thresholdColor).toBe('error');
    // Task 4: no v-chip in the summary anymore — tooltip replaces it
    const summary = wrapper.find('.billing-meter-progress__summary');
    expect(summary.text()).not.toContain('+20 over');
    // Tooltip icon must exist in overflow state
    const tooltip = wrapper.findComponent({ name: 'v-tooltip' });
    expect(tooltip.exists()).toBe(true);
    // Summary % is error-colored and shows 100%
    expect(summary.text()).toContain('100%');
  });

  it('summary row carries the assertive aria-live announcement when in overage', () => {
    const wrapper = mountComponent({ used: 120, quota: 100, overage: 20, netRemainingRaw: -20 });
    // Task 4: a single summary aria-live region announces overage state changes
    // (the previously empty overage div had no content and was removed to avoid
    // dual assertive regions racing each other in assistive tech).
    const summary = wrapper.find('.billing-meter-progress__summary');
    expect(summary.attributes('aria-live')).toBe('assertive');
    // Summary text carries the % primary value and overage tooltip is reachable
    expect(summary.text()).toContain('100%');
  });

  it('summary aria-live is polite (non-interrupting) when not in overage', () => {
    const wrapper = mountComponent({ used: 50, quota: 100 });
    expect(wrapper.find('.billing-meter-progress__summary').attributes('aria-live')).toBe('polite');
  });

  it('matches the overage snapshot', () => {
    const wrapper = mountComponent({ used: 120, quota: 100, overage: 20, netRemainingRaw: -20 });
    expect(wrapper.find('.billing-meter-progress').html()).toMatchSnapshot();
  });

  // ── % primary display (Task 4) ────────────────────────────────────────────

  describe('% primary display', () => {
    it('shows "62%" as the primary summary text when used=62 quota=100', async () => {
      const wrapper = mountComponent({ used: 62, quota: 100, label: 'Compute' });
      await wrapper.vm.$nextTick();
      // Primary value in summary row must show the percentage
      const summary = wrapper.find('.billing-meter-progress__summary');
      expect(summary.text()).toContain('62%');
      // Raw compute units must NOT appear inline (only in tooltip)
      expect(summary.text()).not.toContain('62 / 100');
    });

    it('does not show raw compute units in summary when not in overage', async () => {
      const wrapper = mountComponent({ used: 46, quota: 1600 });
      await wrapper.vm.$nextTick();
      const summary = wrapper.find('.billing-meter-progress__summary');
      // 46/1600 = 2.875 → rounds to 3%
      expect(summary.text()).toContain('3%');
      expect(summary.text()).not.toContain('46 / 1600');
    });

    it('shows tooltip with compute units when overage > 0', async () => {
      const wrapper = mountComponent({ used: 120, quota: 100, overage: 20, netRemainingRaw: -20, label: 'Compute' });
      await wrapper.vm.$nextTick();
      // Tooltip activator (v-icon) must exist when in overage
      const tooltipEl = wrapper.findComponent({ name: 'v-tooltip' });
      expect(tooltipEl.exists()).toBe(true);
      // tooltip text prop must contain the raw compute breakdown
      const tooltipText = tooltipEl.props('text');
      expect(tooltipText).toContain('120 / 100');
    });

    it('does NOT show overage chip in summary (replaced by tooltip icon)', async () => {
      const wrapper = mountComponent({ used: 120, quota: 100, overage: 20, netRemainingRaw: -20 });
      await wrapper.vm.$nextTick();
      // Old behavior: v-chip with "+20 over" was in the summary; new: only tooltip icon
      const summary = wrapper.find('.billing-meter-progress__summary');
      // The chip for overage details should be gone from summary (only tooltip icon remains)
      expect(summary.text()).not.toContain('+20 over');
    });
  });
});
