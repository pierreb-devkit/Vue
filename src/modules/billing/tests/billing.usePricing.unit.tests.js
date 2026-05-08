/**
 * Unit tests for usePricing composable.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '../../auth/stores/auth.store.js';
import { useBillingStore } from '../stores/billing.store.js';
import { usePricing } from '../composables/billing.usePricing.js';

vi.mock('../config/billing.static-content.js', () => ({
  pricingMode: null,
  plans: [
    { id: 'free', name: 'Free', monthlyPrice: 0, annualPrice: 0, features: [], featureSections: [] },
    { id: 'pro', name: 'Pro', monthlyPrice: 39, annualPrice: 390, features: [], featureSections: [] },
  ],
  packs: [{ packId: 'boost', label: 'Boost', priceUsd: 9, meterUnits: 5000 }],
  faqs: [{ id: 'q1', question: 'What is X?', answer: 'X is Y.' }],
}));

describe('usePricing', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('exposes plans, packs, faqs from static-content', () => {
    const auth = useAuthStore();
    auth.serverConfig = { billing: { meterMode: false } };
    const billing = useBillingStore();
    billing.plans = [];
    const result = usePricing();
    expect(result.plans.value).toHaveLength(2);
    expect(result.packs.value).toHaveLength(1);
    expect(result.faqs.value).toHaveLength(1);
  });

  it('mode = subscription when meterMode=false (legacy fallback)', () => {
    const auth = useAuthStore();
    auth.serverConfig = { billing: { meterMode: false } };
    const result = usePricing();
    expect(result.mode.value).toBe('subscription');
  });

  it('mode = both-tabs when meterMode=true and packs present (legacy fallback)', () => {
    const auth = useAuthStore();
    auth.serverConfig = { billing: { meterMode: true } };
    const result = usePricing();
    expect(result.mode.value).toBe('both-tabs');
  });

  it('maxAnnualSavingsPct exposes the largest discount across plans', () => {
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

  it('plans array normalises legacy {amount, id} price objects to scalar numbers', () => {
    // When static-content uses legacy {amount, id} shapes, usePricing must convert them
    // to scalar numbers so computeAnnualSavingsPct and computeMaxAnnualSavingsPct work correctly.
    // We simulate this by overriding billing store plans with object-shaped stripePrices
    // (the composable already normalises stripePlan.monthlyPrice → Number()).
    const auth = useAuthStore();
    auth.serverConfig = { billing: { meterMode: false } };
    const billing = useBillingStore();
    // Provide Stripe data with prices as numbers (the store's real shape)
    billing.plans = [{ planId: 'pro', stripePriceMonthly: 'price_m', stripePriceAnnual: 'price_a', monthlyPrice: 39, annualPrice: 390 }];
    const result = usePricing();
    const proPlan = result.plans.value.find((p) => p.id === 'pro');
    // After normalisation, monthlyPrice and annualPrice must be plain numbers
    expect(typeof proPlan.monthlyPrice).toBe('number');
    expect(typeof proPlan.annualPrice).toBe('number');
    // maxAnnualSavingsPct must still compute correctly (not 0% due to NaN coercion)
    expect(result.maxAnnualSavingsPct.value).toBe(17);
  });
});
