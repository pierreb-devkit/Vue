import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createVuetify } from 'vuetify';
import { createI18n } from 'vue-i18n';
import BillingExtrasLedgerComponent from '../components/billing.extrasLedger.component.vue';
import { billingEn } from '../lang/en.js';

const vuetify = createVuetify();
const i18n = createI18n({ legacy: false, globalInjection: true, locale: 'en', fallbackLocale: 'en', messages: { en: { ...billingEn } } });

/** Sample ledger entries covering all entry kinds. */
const SAMPLE_ENTRIES = [
  {
    at: '2026-04-01T10:00:00.000Z',
    kind: 'topup',
    amount: 500,
    refId: 'ref_topup_001',
    stripeSessionId: 'cs_test_abc123xyz456',
  },
  {
    at: '2026-04-02T11:30:00.000Z',
    kind: 'debit',
    amount: -100,
    historyId: 'hist_debit_002',
    stripeSessionId: null,
  },
  {
    at: '2026-04-03T09:15:00.000Z',
    kind: 'refund',
    amount: 50,
    refId: 'ref_refund_003',
    stripeSessionId: 're_test_refund999',
  },
  {
    at: '2026-04-04T14:00:00.000Z',
    kind: 'expiration',
    amount: -200,
    refId: null,
    stripeSessionId: null,
  },
  {
    at: '2026-04-05T08:00:00.000Z',
    kind: 'adjustment',
    amount: 25,
    refId: 'ref_adj_005',
    stripeSessionId: null,
  },
];

/**
 * Mount BillingExtrasLedgerComponent with Vuetify and Pinia installed.
 * @param {Object} props - Component props
 * @returns {import('@vue/test-utils').VueWrapper}
 */
const mountComponent = (props) =>
  mount(BillingExtrasLedgerComponent, {
    props,
    global: { plugins: [vuetify, i18n] },
    attachTo: document.body,
  });

describe('BillingExtrasLedgerComponent', () => {
  let wrapper;

  beforeEach(() => {
    setActivePinia(createPinia());
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
  });

  // ── Empty state ───────────────────────────────────────────────────────────

  it('shows empty state when entries array is empty', () => {
    wrapper = mountComponent({ entries: [], total: 0 });
    expect(wrapper.text()).toContain('No ledger entries yet');
  });

  it('does not render table when entries is empty', () => {
    wrapper = mountComponent({ entries: [], total: 0 });
    expect(wrapper.findComponent({ name: 'v-data-table' }).exists()).toBe(false);
  });

  // ── Kind chip colors ──────────────────────────────────────────────────────

  it('returns success color for topup kind', () => {
    wrapper = mountComponent({ entries: SAMPLE_ENTRIES, total: 5 });
    expect(wrapper.vm.kindColor('topup')).toBe('success');
  });

  it('returns warning color for debit kind', () => {
    wrapper = mountComponent({ entries: SAMPLE_ENTRIES, total: 5 });
    expect(wrapper.vm.kindColor('debit')).toBe('warning');
  });

  it('returns info color for refund kind', () => {
    wrapper = mountComponent({ entries: SAMPLE_ENTRIES, total: 5 });
    expect(wrapper.vm.kindColor('refund')).toBe('info');
  });

  it('returns default color for expiration kind', () => {
    wrapper = mountComponent({ entries: SAMPLE_ENTRIES, total: 5 });
    expect(wrapper.vm.kindColor('expiration')).toBe('default');
  });

  it('returns primary color for adjustment kind', () => {
    wrapper = mountComponent({ entries: SAMPLE_ENTRIES, total: 5 });
    expect(wrapper.vm.kindColor('adjustment')).toBe('primary');
  });

  it('returns default color for unknown kind', () => {
    wrapper = mountComponent({ entries: SAMPLE_ENTRIES, total: 5 });
    expect(wrapper.vm.kindColor('unknown_kind')).toBe('default');
  });

  // ── Signed amount display ─────────────────────────────────────────────────

  it('formatDate returns — for null/undefined', () => {
    wrapper = mountComponent({ entries: SAMPLE_ENTRIES, total: 5 });
    expect(wrapper.vm.formatDate(null)).toBe('—');
    expect(wrapper.vm.formatDate(undefined)).toBe('—');
    expect(wrapper.vm.formatDate('')).toBe('—');
  });

  it('formatDate returns a non-empty string for valid ISO date', () => {
    wrapper = mountComponent({ entries: SAMPLE_ENTRIES, total: 5 });
    const result = wrapper.vm.formatDate('2026-04-01T10:00:00.000Z');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    expect(result).not.toBe('—');
  });

  // ── Truncation ────────────────────────────────────────────────────────────

  it('truncates long strings to 12 chars + ellipsis', () => {
    wrapper = mountComponent({ entries: SAMPLE_ENTRIES, total: 5 });
    const result = wrapper.vm.truncate('cs_test_abc123xyz456');
    expect(result).toBe('cs_test_abc1…');
    expect(result.length).toBe(13); // 12 + ellipsis char
  });

  it('returns string as-is when <= 12 characters', () => {
    wrapper = mountComponent({ entries: SAMPLE_ENTRIES, total: 5 });
    expect(wrapper.vm.truncate('short')).toBe('short');
  });

  it('returns — for null/undefined values', () => {
    wrapper = mountComponent({ entries: SAMPLE_ENTRIES, total: 5 });
    expect(wrapper.vm.truncate(null)).toBe('—');
    expect(wrapper.vm.truncate(undefined)).toBe('—');
    expect(wrapper.vm.truncate('')).toBe('—');
  });

  // ── Pagination ────────────────────────────────────────────────────────────

  it('computes correct pageCount', () => {
    wrapper = mountComponent({ entries: SAMPLE_ENTRIES, total: 45, limit: 20 });
    expect(wrapper.vm.pageCount).toBe(3);
  });

  it('computes pageCount of 1 when total <= limit', () => {
    wrapper = mountComponent({ entries: SAMPLE_ENTRIES, total: 5, limit: 20 });
    expect(wrapper.vm.pageCount).toBe(1);
  });

  it('emits update:page when VPagination fires update:modelValue', async () => {
    wrapper = mountComponent({ entries: SAMPLE_ENTRIES, total: 45, limit: 20, page: 1 });
    const pagination = wrapper.findComponent({ name: 'VPagination' });
    expect(pagination.exists()).toBe(true);
    await pagination.vm.$emit('update:modelValue', 2);
    expect(wrapper.emitted('update:page')).toBeTruthy();
    expect(wrapper.emitted('update:page')[0]).toEqual([2]);
  });

  it('does not render pagination when pageCount is 1', () => {
    wrapper = mountComponent({ entries: SAMPLE_ENTRIES, total: 5, limit: 20 });
    expect(wrapper.findComponent({ name: 'v-pagination' }).exists()).toBe(false);
  });

  // ── Table rendering ───────────────────────────────────────────────────────

  it('renders data table when entries are provided', () => {
    wrapper = mountComponent({ entries: SAMPLE_ENTRIES, total: 5 });
    expect(wrapper.findComponent({ name: 'v-data-table' }).exists()).toBe(true);
  });

  it('passes correct items-per-page to data table', () => {
    wrapper = mountComponent({ entries: SAMPLE_ENTRIES, total: 5, limit: 10 });
    const table = wrapper.findComponent({ name: 'v-data-table' });
    expect(table.props('itemsPerPage')).toBe(10);
  });

  it('passes correct page to data table', () => {
    wrapper = mountComponent({ entries: SAMPLE_ENTRIES, total: 5, page: 2 });
    const table = wrapper.findComponent({ name: 'v-data-table' });
    expect(table.props('page')).toBe(2);
  });

  // ── Default props ─────────────────────────────────────────────────────────

  it('defaults page to 1', () => {
    wrapper = mountComponent({ entries: SAMPLE_ENTRIES, total: 5 });
    expect(wrapper.vm.page).toBe(1);
  });

  it('defaults limit to 20', () => {
    wrapper = mountComponent({ entries: SAMPLE_ENTRIES, total: 5 });
    expect(wrapper.vm.limit).toBe(20);
  });
});
