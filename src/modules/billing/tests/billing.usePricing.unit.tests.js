/**
 * Unit tests for usePricing composable.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '../../auth/stores/auth.store.js';
import { useBillingStore } from '../stores/billing.store.js';
import { usePricing } from '../composables/billing.usePricing.js';

vi.mock('../lib/billing.resolveStaticContent.js', () => ({
  resolveStaticContent: () => ({
    pricingMode: null,
    tabs: [
      {
        id: 'plans',
        label: 'My Plans',
        annualToggle: true,
        plans: [
          { id: 'free', name: 'Free', monthlyPrice: 0, annualPrice: 0, features: [], featureSections: [] },
          { id: 'pro', name: 'Pro', monthlyPrice: 39, annualPrice: 390, features: [], featureSections: [] },
        ],
        packs: null,
      },
      {
        id: 'units',
        label: 'My Units',
        annualToggle: false,
        plans: null,
        packs: [{ packId: 'boost', label: 'Boost', priceUsd: 9, meterUnits: 5000 }],
      },
    ],
    faqs: {
      title: 'Frequently asked questions',
      subtitle: null,
      content: [{ id: 'q1', question: 'What is X?', answer: 'X is Y.' }],
    },
    header: { title: null, subtitle: null },
    halo: null,
  }),
}));

describe('usePricing', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('exposes tabs, and the plans/packs they carry, from static-content', () => {
    const auth = useAuthStore();
    auth.serverConfig = { billing: { meterMode: false } };
    const billing = useBillingStore();
    billing.plans = [];
    const result = usePricing();
    expect(result.tabs.value).toHaveLength(2);
    expect(result.allPlans.value).toHaveLength(2);
    expect(result.allPacks.value).toHaveLength(1);
    expect(result.faqs.value.content).toHaveLength(1);
  });

  it('honours a null slot — a packs tab never reports plans, and vice versa', () => {
    const result = usePricing();
    const [plansTab, packsTab] = result.tabs.value;
    expect(plansTab.packs).toBeNull();
    expect(packsTab.plans).toBeNull();
  });

  it('mode = both-tabs from the tab count alone, with no explicit mode and meterMode=false', () => {
    const auth = useAuthStore();
    auth.serverConfig = { billing: { meterMode: false } };
    const result = usePricing();
    expect(result.mode.value).toBe('both-tabs');
  });

  it('maxAnnualSavingsPct exposes the largest discount across every tab', () => {
    const result = usePricing();
    // 39*12=468, 390 → 17%
    expect(result.maxAnnualSavingsPct.value).toBe(17);
  });

  it('hasPlans / hasPacks / hasFaqs reflect static-content presence', () => {
    const result = usePricing();
    expect(result.hasPlans.value).toBe(true);
    expect(result.hasPacks.value).toBe(true);
    expect(result.hasFaqs.value).toBe(true);
  });

  it('hasFaqs reflects content array length', () => {
    const result = usePricing();
    expect(result.hasFaqs.value).toBe(true);
    expect(result.faqs.value.title).toBe('Frequently asked questions');
  });

  it('exposes per-tab labels and the annualToggle option', () => {
    const result = usePricing();
    expect(result.tabs.value.map((t) => t.label)).toEqual(['My Plans', 'My Units']);
    expect(result.tabs.value.map((t) => t.annualToggle)).toEqual([true, false]);
  });

  it('exposes header from static-content (null fields)', () => {
    const result = usePricing();
    expect(result.header.value).toMatchObject({ title: null, subtitle: null });
  });

  it('exposes halo from static-content (null when not configured)', () => {
    const result = usePricing();
    expect(result.halo.value).toBeNull();
  });

  it('enriches every tab plans collection against the same billingStore.plans', () => {
    // When static-content uses legacy {amount, id} shapes, resolvePlanPricing must convert
    // them to scalar numbers so computeAnnualSavingsPct / computeMaxAnnualSavingsPct work.
    const auth = useAuthStore();
    auth.serverConfig = { billing: { meterMode: false } };
    const billing = useBillingStore();
    // Provide Stripe data with prices as numbers (the store's real shape)
    billing.plans = [{ planId: 'pro', stripePriceMonthly: 'price_m', stripePriceAnnual: 'price_a', monthlyPrice: 39, annualPrice: 390 }];
    const result = usePricing();
    const proPlan = result.allPlans.value.find((p) => p.id === 'pro');
    // After normalisation, monthlyPrice and annualPrice must be plain numbers
    expect(typeof proPlan.monthlyPrice).toBe('number');
    expect(typeof proPlan.annualPrice).toBe('number');
    // Stripe price objects are attached by the shared enrichment helper
    expect(proPlan.monthlyPriceObject).toEqual({ amount: 39, id: 'price_m' });
    // maxAnnualSavingsPct must still compute correctly (not 0% due to NaN coercion)
    expect(result.maxAnnualSavingsPct.value).toBe(17);
  });
});
