/**
 * @fileoverview Unit tests for pricingMath helpers.
 */
import { describe, it, expect } from 'vitest';
import {
  computeAnnualSavingsPct,
  computeMaxAnnualSavingsPct,
  resolvePricingMode,
  resolvePlanPricing,
  resolveTabIndexFromHash,
  findPlan,
  collectPlans,
  collectPacks,
} from '../lib/pricingMath.js';

/**
 * @desc Build a normalized tabs fixture: a plans tab, then a packs tab.
 * @returns {Array<Object>}
 */
function twoTabs() {
  return [
    { id: 'plans', label: 'Plans', annualToggle: true, plans: [{ id: 'free' }, { id: 'pro' }], packs: null },
    { id: 'extras', label: 'Extras', annualToggle: false, plans: null, packs: [{ id: 'pack_a' }] },
  ];
}

describe('computeAnnualSavingsPct', () => {
  it('returns 0 when monthlyPrice is 0 (free plan)', () => {
    expect(computeAnnualSavingsPct({ monthlyPrice: 0, annualPrice: 0 })).toBe(0);
  });

  it('returns 0 when annualPrice is missing or null', () => {
    expect(computeAnnualSavingsPct({ monthlyPrice: 39, annualPrice: null })).toBe(0);
    expect(computeAnnualSavingsPct({ monthlyPrice: 39 })).toBe(0);
  });

  it('returns rounded percentage savings — 39/mo, 390/yr → 17%', () => {
    expect(computeAnnualSavingsPct({ monthlyPrice: 39, annualPrice: 390 })).toBe(17);
  });

  it('returns 0 when annualPrice ≥ monthlyPrice * 12 (no discount)', () => {
    expect(computeAnnualSavingsPct({ monthlyPrice: 10, annualPrice: 120 })).toBe(0);
    expect(computeAnnualSavingsPct({ monthlyPrice: 10, annualPrice: 130 })).toBe(0);
  });

  it('handles 20% discount cleanly — 100/mo, 960/yr → 20%', () => {
    expect(computeAnnualSavingsPct({ monthlyPrice: 100, annualPrice: 960 })).toBe(20);
  });
});

describe('computeMaxAnnualSavingsPct', () => {
  it('returns 0 for empty plans array', () => {
    expect(computeMaxAnnualSavingsPct([])).toBe(0);
  });

  it('returns 0 when no plan has both monthly and annual prices', () => {
    expect(
      computeMaxAnnualSavingsPct([
        { monthlyPrice: 0, annualPrice: 0 },
        { monthlyPrice: 39, annualPrice: null },
      ]),
    ).toBe(0);
  });

  it('returns the largest savings across plans', () => {
    expect(
      computeMaxAnnualSavingsPct([
        { monthlyPrice: 39, annualPrice: 390 },   // 17%
        { monthlyPrice: 159, annualPrice: 1430 }, // 25%
        { monthlyPrice: 0, annualPrice: 0 },
      ]),
    ).toBe(25);
  });
});

describe('resolvePricingMode', () => {
  it('returns explicit pricingMode when provided', () => {
    expect(
      resolvePricingMode({
        explicit: 'both-tabs',
        meterMode: false,
        hasPlans: true,
        hasPacks: true,
      }),
    ).toBe('both-tabs');
  });

  it('legacy fallback: meterMode=true + packs → both-tabs', () => {
    expect(
      resolvePricingMode({
        explicit: null,
        meterMode: true,
        hasPlans: true,
        hasPacks: true,
      }),
    ).toBe('both-tabs');
  });

  it('legacy fallback: meterMode=true + no packs → subscription', () => {
    expect(
      resolvePricingMode({
        explicit: null,
        meterMode: true,
        hasPlans: true,
        hasPacks: false,
      }),
    ).toBe('subscription');
  });

  it('legacy fallback: meterMode=false → subscription', () => {
    expect(
      resolvePricingMode({
        explicit: null,
        meterMode: false,
        hasPlans: true,
        hasPacks: true,
      }),
    ).toBe('subscription');
  });

  it('packs-only when explicit and no plans', () => {
    expect(
      resolvePricingMode({
        explicit: 'packs',
        meterMode: false,
        hasPlans: false,
        hasPacks: true,
      }),
    ).toBe('packs');
  });

  it('throws on unknown explicit mode (catches typos in config)', () => {
    expect(() =>
      resolvePricingMode({
        explicit: 'both-stacked',
        meterMode: false,
        hasPlans: true,
        hasPacks: true,
      }),
    ).toThrow(/unknown pricingMode/i);
  });

  it('treats empty-string explicit as not-provided (falls through to legacy)', () => {
    expect(
      resolvePricingMode({
        explicit: '',
        meterMode: false,
        hasPlans: true,
        hasPacks: true,
      }),
    ).toBe('subscription');
  });

  it('more than one configured tab resolves to both-tabs BEFORE the legacy heuristic', () => {
    // Two PLANS tabs: the legacy `hasPlans && hasPacks` rule would say 'subscription'
    // and silently hide the second tab. tabCount wins.
    expect(
      resolvePricingMode({
        explicit: null,
        meterMode: false,
        hasPlans: true,
        hasPacks: false,
        tabCount: 2,
      }),
    ).toBe('both-tabs');
  });

  it('a single tab still falls through to the legacy heuristic', () => {
    expect(
      resolvePricingMode({
        explicit: null,
        meterMode: false,
        hasPlans: false,
        hasPacks: true,
        tabCount: 1,
      }),
    ).toBe('packs');
  });
});

describe('resolveTabIndexFromHash', () => {
  it('resolves the legacy "units" ALIAS to the first packs-slot tab, whatever it is named', () => {
    const tabs = twoTabs();
    expect(resolveTabIndexFromHash({ hash: '#units', tabs })).toBe(1);
  });

  it('alias wins over an exact id match — a plans tab named "units" must NOT capture the packs CTA', () => {
    // The discriminating case: with id-matching first, this returns 0 and every
    // "Buy extras" CTA in the app lands on a page selling subscriptions.
    const tabs = [
      { id: 'units', label: 'Confusing', annualToggle: true, plans: [{ id: 'pro' }], packs: null },
      { id: 'realpacks', label: 'Packs', annualToggle: false, plans: null, packs: [{ id: 'pack_a' }] },
    ];
    expect(resolveTabIndexFromHash({ hash: '#units', tabs })).toBe(1);
  });

  it('falls back to an exact tab id when the alias matches no packs tab', () => {
    const tabs = [
      { id: 'plans', label: 'Plans', annualToggle: true, plans: [{ id: 'pro' }], packs: null },
      { id: 'teams', label: 'Teams', annualToggle: true, plans: [{ id: 'team' }], packs: null },
    ];
    expect(resolveTabIndexFromHash({ hash: '#teams', tabs })).toBe(1);
    // No packs tab exists at all, so the alias cannot resolve → falls through to 0.
    expect(resolveTabIndexFromHash({ hash: '#units', tabs })).toBe(0);
  });

  it('returns 0 for an unknown hash, an empty hash, or no tabs', () => {
    const tabs = twoTabs();
    expect(resolveTabIndexFromHash({ hash: '#nope', tabs })).toBe(0);
    expect(resolveTabIndexFromHash({ hash: '', tabs })).toBe(0);
    expect(resolveTabIndexFromHash({ hash: undefined, tabs })).toBe(0);
    expect(resolveTabIndexFromHash({ hash: '#units', tabs: [] })).toBe(0);
  });

  it('accepts a hash with or without the leading #', () => {
    const tabs = twoTabs();
    expect(resolveTabIndexFromHash({ hash: 'extras', tabs })).toBe(1);
  });
});

describe('resolvePlanPricing', () => {
  const billingPlans = [
    { planId: 'pro', stripePriceMonthly: 'price_m', stripePriceAnnual: 'price_a', monthlyPrice: 39, annualPrice: 390 },
  ];

  it('keeps static scalar prices and attaches the Stripe price objects', () => {
    const result = resolvePlanPricing({ id: 'pro', monthlyPrice: 49, annualPrice: 490 }, billingPlans);
    expect(result.monthlyPrice).toBe(49);
    expect(result.annualPrice).toBe(490);
    expect(result.monthlyPriceObject).toEqual({ amount: 39, id: 'price_m' });
    expect(result.annualPriceObject).toEqual({ amount: 390, id: 'price_a' });
  });

  it('normalises a legacy { amount, id } static price to a scalar number', () => {
    const result = resolvePlanPricing({ id: 'pro', monthlyPrice: { amount: 29, id: 'legacy' } }, billingPlans);
    expect(result.monthlyPrice).toBe(29);
  });

  it('falls back to the Stripe amount when the static plan declares no price', () => {
    const result = resolvePlanPricing({ id: 'pro' }, billingPlans);
    expect(result.monthlyPrice).toBe(39);
    expect(result.annualPrice).toBe(390);
  });

  it('matches on a case-insensitive name when planId does not match', () => {
    const result = resolvePlanPricing({ id: 'pro' }, [
      { name: 'PRO', stripePriceMonthly: 'price_x', monthlyPrice: 12 },
    ]);
    expect(result.monthlyPriceObject).toEqual({ amount: 12, id: 'price_x' });
  });

  it('never throws when there is no Stripe match or no store data at all', () => {
    expect(resolvePlanPricing({ id: 'ghost' }, billingPlans).monthlyPriceObject).toBeNull();
    expect(resolvePlanPricing({ id: 'ghost' }, null).monthlyPrice).toBe(0);
  });

  it('enriches a plan identically regardless of which tab owns it', () => {
    // The whole point of the single enrichment site: same static plan, same store,
    // same result — a plan in tab 3 is priced exactly like a plan in tab 1.
    const plan = { id: 'pro', monthlyPrice: 39 };
    expect(resolvePlanPricing(plan, billingPlans)).toEqual(resolvePlanPricing({ ...plan }, billingPlans));
  });
});

describe('findPlan / collectPlans / collectPacks', () => {
  it('findPlan returns the plan AND its owning tab', () => {
    const tabs = twoTabs();
    const found = findPlan(tabs, 'pro');
    expect(found.plan).toEqual({ id: 'pro' });
    expect(found.tab).toBe(tabs[0]);
  });

  it('findPlan returns null for an unknown id, a missing id, or unusable tabs', () => {
    expect(findPlan(twoTabs(), 'nope')).toBeNull();
    expect(findPlan(twoTabs(), undefined)).toBeNull();
    expect(findPlan(null, 'pro')).toBeNull();
  });

  it('findPlan distinguishes the owning tab across multiple plans tabs', () => {
    const tabs = [
      { id: 'plans', plans: [{ id: 'free' }, { id: 'pro' }], packs: null },
      { id: 'teams', plans: [{ id: 'team' }], packs: null },
    ];
    expect(findPlan(tabs, 'pro').tab.id).toBe('plans');
    expect(findPlan(tabs, 'team').tab.id).toBe('teams');
  });

  it('collectPlans / collectPacks flatten in tab order and skip null slots', () => {
    const tabs = twoTabs();
    expect(collectPlans(tabs)).toEqual([{ id: 'free' }, { id: 'pro' }]);
    expect(collectPacks(tabs)).toEqual([{ id: 'pack_a' }]);
  });

  it('collectPlans / collectPacks return [] for unusable input', () => {
    expect(collectPlans(null)).toEqual([]);
    expect(collectPacks(undefined)).toEqual([]);
    expect(collectPacks([{ id: 'x', plans: [{ id: 'p' }], packs: null }])).toEqual([]);
  });
});
