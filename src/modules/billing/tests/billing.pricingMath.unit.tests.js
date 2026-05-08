/**
 * @fileoverview Unit tests for pricingMath helpers.
 */
import { describe, it, expect } from 'vitest';
import {
  computeAnnualSavingsPct,
  computeMaxAnnualSavingsPct,
  resolvePricingMode,
} from '../lib/pricingMath.js';

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
});
