import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useBillingStore } from '../stores/billing.store';
import { useBilling } from '../composables/billing.useBilling';

describe('useBilling composable', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('isPlanActive (P1-3)', () => {
    it('returns true when subscription status is "active"', () => {
      const store = useBillingStore();
      store.subscription = { status: 'active', plan: 'starter' };
      const { isPlanActive } = useBilling();
      expect(isPlanActive.value).toBe(true);
    });

    it('returns true when subscription status is "trialing" (P1-3)', () => {
      const store = useBillingStore();
      store.subscription = { status: 'trialing', plan: 'starter' };
      const { isPlanActive } = useBilling();
      expect(isPlanActive.value).toBe(true);
    });

    it('returns false when subscription is null', () => {
      const store = useBillingStore();
      store.subscription = null;
      const { isPlanActive } = useBilling();
      expect(isPlanActive.value).toBe(false);
    });

    it('returns false when status is "canceled"', () => {
      const store = useBillingStore();
      store.subscription = { status: 'canceled', plan: 'starter' };
      const { isPlanActive } = useBilling();
      expect(isPlanActive.value).toBe(false);
    });

    it('returns false when status is "past_due"', () => {
      const store = useBillingStore();
      store.subscription = { status: 'past_due', plan: 'starter' };
      const { isPlanActive } = useBilling();
      expect(isPlanActive.value).toBe(false);
    });

    it('returns false when status is "incomplete"', () => {
      const store = useBillingStore();
      store.subscription = { status: 'incomplete', plan: 'starter' };
      const { isPlanActive } = useBilling();
      expect(isPlanActive.value).toBe(false);
    });
  });

  describe('currentPlan', () => {
    it('returns subscription plan when set', () => {
      const store = useBillingStore();
      store.subscription = { status: 'active', plan: 'pro' };
      const { currentPlan } = useBilling();
      expect(currentPlan.value).toBe('pro');
    });

    it('defaults to "free" when no subscription', () => {
      const store = useBillingStore();
      store.subscription = null;
      const { currentPlan } = useBilling();
      expect(currentPlan.value).toBe('free');
    });
  });

  describe('hasPlan', () => {
    it('returns true when current plan matches one of the provided plans', () => {
      const store = useBillingStore();
      store.subscription = { status: 'active', plan: 'starter' };
      const { hasPlan } = useBilling();
      expect(hasPlan('starter', 'pro')).toBe(true);
    });

    it('returns false when current plan is not in the provided plans', () => {
      const store = useBillingStore();
      store.subscription = { status: 'active', plan: 'free' };
      const { hasPlan } = useBilling();
      expect(hasPlan('starter', 'pro')).toBe(false);
    });
  });
});
