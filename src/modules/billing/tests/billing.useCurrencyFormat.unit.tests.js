import { describe, it, expect } from 'vitest';
import { useCurrencyFormat } from '../composables/billing.useCurrencyFormat.js';

describe('useCurrencyFormat', () => {
  it('formatPrice formats amount as USD in en-US locale', () => {
    const { formatPrice } = useCurrencyFormat();
    expect(formatPrice(1299)).toBe('$1,299.00');
  });

  it('formatPrice always returns en-US format (locale is fixed)', () => {
    // Product is USD/en-US only — locale is no longer configurable
    const { formatPrice } = useCurrencyFormat();
    expect(formatPrice(1299)).toBe('$1,299.00');
  });

  it('formatPrice formats zero correctly', () => {
    const { formatPrice } = useCurrencyFormat();
    expect(formatPrice(0)).toBe('$0.00');
  });

  it('formatPrice formats small amount', () => {
    const { formatPrice } = useCurrencyFormat();
    expect(formatPrice(9)).toBe('$9.00');
  });

  it('formatPrice always uses USD currency', () => {
    const { formatPrice } = useCurrencyFormat();
    expect(formatPrice(100)).toContain('$');
    expect(formatPrice(100)).toBe('$100.00');
  });

  it('formatPrice returns consistent results across calls (fixed locale — no locale-change reactivity)', () => {
    const { formatPrice } = useCurrencyFormat();
    const first = formatPrice(1299);
    const second = formatPrice(1299);
    expect(first).toBe('$1,299.00');
    expect(second).toBe('$1,299.00');
  });

  it('formatPrice always produces en-US format regardless of any external state', () => {
    const { formatPrice } = useCurrencyFormat();
    // Locale is now fixed — always en-US
    expect(formatPrice(1299)).toBe('$1,299.00');
  });

  it('formatPrice does not throw and returns USD for any valid number', () => {
    const { formatPrice } = useCurrencyFormat();
    expect(() => formatPrice(100)).not.toThrow();
    expect(formatPrice(100)).toContain('$');
  });

  it('formatPrice does not throw for any valid number (fixed locale)', () => {
    const { formatPrice } = useCurrencyFormat();
    expect(() => formatPrice(50)).not.toThrow();
    expect(formatPrice(50)).toContain('$');
  });

  it('formatPrice always returns en-US format (fixed locale — no BCP47 fallback needed)', () => {
    const { formatPrice } = useCurrencyFormat();
    expect(() => formatPrice(1299)).not.toThrow();
    // Always en-US
    expect(formatPrice(1299)).toBe('$1,299.00');
  });

  it('formatPrice always produces en-US format (fixed locale — no locale variation)', () => {
    const { formatPrice } = useCurrencyFormat();
    // en-US only — no FR format
    expect(formatPrice(1299)).toBe('$1,299.00');
  });

  // ── NaN / non-finite guard ────────────────────────────────────────

  it('formatPrice returns em dash for NaN', () => {
    const { formatPrice } = useCurrencyFormat();
    expect(formatPrice(NaN)).toBe('—');
  });

  it('formatPrice returns em dash for undefined', () => {
    const { formatPrice } = useCurrencyFormat();
    expect(formatPrice(undefined)).toBe('—');
  });

  it('formatPrice returns em dash for null', () => {
    const { formatPrice } = useCurrencyFormat();
    expect(formatPrice(null)).toBe('—');
  });

  it('formatPrice returns em dash for Infinity', () => {
    const { formatPrice } = useCurrencyFormat();
    expect(formatPrice(Infinity)).toBe('—');
  });

  it('formatPrice formats 0 correctly (zero is a valid price)', () => {
    const { formatPrice } = useCurrencyFormat();
    expect(formatPrice(0)).toBe('$0.00');
  });

  it('formatPrice formats negative amount correctly', () => {
    const { formatPrice } = useCurrencyFormat();
    expect(formatPrice(-100)).toBe('-$100.00');
  });
});
