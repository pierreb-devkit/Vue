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

  it('palette colors are stable when a zero bucket is toggled on', () => {
    // Initial state: a=0, b=50, c=0, d=100 — only b and d are active
    const w1 = mountComponent({ breakdown: { a: 0, b: 50, c: 0, d: 100 } });
    const colorB1 = w1.vm.activeBuckets.find((bk) => bk.key === 'b').color;
    const colorD1 = w1.vm.activeBuckets.find((bk) => bk.key === 'd').color;

    // After toggle: a becomes 10 — b and d must keep the exact same colors
    const w2 = mountComponent({ breakdown: { a: 10, b: 50, c: 0, d: 100 } });
    const colorB2 = w2.vm.activeBuckets.find((bk) => bk.key === 'b').color;
    const colorD2 = w2.vm.activeBuckets.find((bk) => bk.key === 'd').color;

    expect(colorB2).toBe(colorB1);
    expect(colorD2).toBe(colorD1);
  });

  // ── Linear bar rendering (new v-progress-linear design) ──────────────────

  it('renders one v-progress-linear per non-zero bucket', () => {
    const wrapper = mountComponent({ breakdown: { scrap: 100, autofix: 50, wizard: 0 } });
    const bars = wrapper.findAllComponents({ name: 'v-progress-linear' });
    // Only scrap and autofix are non-zero → 2 bars
    expect(bars).toHaveLength(2);
  });

  it('v-progress-linear bars have height="10" and rounded props', () => {
    const wrapper = mountComponent({ breakdown: { scrap: 100, autofix: 50 } });
    const bars = wrapper.findAllComponents({ name: 'v-progress-linear' });
    for (const bar of bars) {
      expect(bar.props('height')).toBe('10');
      expect(bar.props('rounded')).toBe(true);
    }
  });

  it('v-progress-linear bars have bg-color="surface-variant"', () => {
    const wrapper = mountComponent({ breakdown: { scrap: 100 } });
    const bar = wrapper.findComponent({ name: 'v-progress-linear' });
    expect(bar.props('bgColor')).toBe('surface-variant');
  });

  it('renders bucket label and percentage above each bar', () => {
    const wrapper = mountComponent({ breakdown: { scrap: 100, autofix: 100 } });
    const text = wrapper.text();
    // Both keys visible
    expect(text).toContain('scrap');
    expect(text).toContain('autofix');
    // Percentages (50% each for equal split)
    expect(text).toContain('50%');
  });

  it('does not render zero-value bucket bar or label', () => {
    const wrapper = mountComponent({ breakdown: { scrap: 100, autofix: 0 } });
    // autofix is zero → not in active buckets → no label rendered
    expect(wrapper.text()).not.toContain('autofix');
    // Only 1 bar for scrap
    expect(wrapper.findAllComponents({ name: 'v-progress-linear' })).toHaveLength(1);
  });

  it('does not render any bar when all buckets are zero', () => {
    const wrapper = mountComponent({ breakdown: { scrap: 0 } });
    expect(wrapper.findAllComponents({ name: 'v-progress-linear' })).toHaveLength(0);
    expect(wrapper.text()).toContain('No usage data');
  });
});
