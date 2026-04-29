import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createVuetify } from 'vuetify';
import BillingMeterBreakdownChartComponent from '../components/billing.meterBreakdownChart.component.vue';

const vuetify = createVuetify();

/**
 * Mount BillingMeterBreakdownChartComponent with Vuetify and Pinia installed.
 * @param {Object} props - Component props
 * @returns {import('@vue/test-utils').VueWrapper}
 */
const mountComponent = (props) =>
  mount(BillingMeterBreakdownChartComponent, {
    props,
    global: { plugins: [vuetify] },
  });

describe('BillingMeterBreakdownChartComponent', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  // ── Non-zero buckets only ─────────────────────────────────────────────────

  it('renders only non-zero buckets', () => {
    const wrapper = mountComponent({ breakdown: { scrap: 100, autofix: 0, wizard: 50 } });
    const buckets = wrapper.vm.activeBuckets;
    expect(buckets).toHaveLength(2);
    expect(buckets.map((b) => b.key)).toEqual(['scrap', 'wizard']);
  });

  it('renders empty state when all buckets are zero', () => {
    const wrapper = mountComponent({ breakdown: { scrap: 0, autofix: 0 } });
    expect(wrapper.text()).toContain('No usage data');
    expect(wrapper.vm.activeBuckets).toHaveLength(0);
  });

  it('renders empty state when breakdown is empty object', () => {
    const wrapper = mountComponent({ breakdown: {} });
    expect(wrapper.text()).toContain('No usage data');
  });

  // ── Total computation ─────────────────────────────────────────────────────

  it('computes total as sum of breakdown values when total prop is omitted', () => {
    const wrapper = mountComponent({ breakdown: { scrap: 100, autofix: 50, wizard: 200 } });
    expect(wrapper.vm.effectiveTotal).toBe(350);
  });

  it('uses the total prop when provided', () => {
    const wrapper = mountComponent({
      breakdown: { scrap: 100, autofix: 50 },
      total: 500,
    });
    expect(wrapper.vm.effectiveTotal).toBe(500);
  });

  it('falls back to sum when total prop is 0', () => {
    const wrapper = mountComponent({
      breakdown: { scrap: 100, autofix: 50 },
      total: 0,
    });
    // total=0 is falsy, falls back to sum
    expect(wrapper.vm.effectiveTotal).toBe(150);
  });

  // ── Percentage computation ────────────────────────────────────────────────

  it('computes percentages summing to ~100 for multiple buckets', () => {
    const wrapper = mountComponent({ breakdown: { scrap: 100, autofix: 100, wizard: 100 } });
    const total = wrapper.vm.activeBuckets.reduce((s, b) => s + b.pct, 0);
    // With 3 equal buckets each 33% → sum is 99 due to rounding
    expect(total).toBeGreaterThanOrEqual(99);
    expect(total).toBeLessThanOrEqual(101);
  });

  it('computes correct percentage for a single bucket', () => {
    const wrapper = mountComponent({ breakdown: { scrap: 200 } });
    expect(wrapper.vm.activeBuckets[0].pct).toBe(100);
  });

  it('computes percentage relative to custom total', () => {
    const wrapper = mountComponent({ breakdown: { scrap: 100 }, total: 400 });
    expect(wrapper.vm.activeBuckets[0].pct).toBe(25);
  });

  // ── Color cycle determinism ────────────────────────────────────────────────

  it('assigns colors deterministically for the same set of buckets', () => {
    const breakdown = { scrap: 100, autofix: 50, wizard: 200 };
    const w1 = mountComponent({ breakdown });
    const w2 = mountComponent({ breakdown });
    const colors1 = w1.vm.activeBuckets.map((b) => b.color);
    const colors2 = w2.vm.activeBuckets.map((b) => b.color);
    expect(colors1).toEqual(colors2);
  });

  it('first bucket gets primary color', () => {
    const wrapper = mountComponent({ breakdown: { scrap: 100, autofix: 50 } });
    expect(wrapper.vm.activeBuckets[0].color).toBe('primary');
  });

  it('second bucket gets secondary color', () => {
    const wrapper = mountComponent({ breakdown: { scrap: 100, autofix: 50 } });
    expect(wrapper.vm.activeBuckets[1].color).toBe('secondary');
  });

  it('cycles through palette when more buckets than palette entries', () => {
    const breakdown = {
      a: 10, b: 10, c: 10, d: 10, e: 10, f: 10, g: 10,
    };
    const wrapper = mountComponent({ breakdown });
    // 7th bucket (index 6) wraps to index 0 → primary
    expect(wrapper.vm.activeBuckets[6].color).toBe('primary');
  });

  // ── Rendering ─────────────────────────────────────────────────────────────

  it('renders the stacked bar when there are active buckets', () => {
    const wrapper = mountComponent({ breakdown: { scrap: 100, autofix: 50 } });
    const bar = wrapper.find('.billing-meter-breakdown-chart__bar');
    expect(bar.exists()).toBe(true);
  });

  it('renders legend entries for active buckets', () => {
    const wrapper = mountComponent({ breakdown: { scrap: 100, autofix: 50 } });
    const legend = wrapper.find('.billing-meter-breakdown-chart__legend');
    expect(legend.exists()).toBe(true);
    expect(legend.text()).toContain('scrap');
    expect(legend.text()).toContain('autofix');
  });

  it('does not render zero-value bucket in legend', () => {
    const wrapper = mountComponent({ breakdown: { scrap: 100, autofix: 0 } });
    expect(wrapper.find('.billing-meter-breakdown-chart__legend').text()).not.toContain('autofix');
  });
});
