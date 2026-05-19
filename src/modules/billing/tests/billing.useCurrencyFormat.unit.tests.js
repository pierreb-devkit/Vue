import { describe, it, expect } from 'vitest';
import { useCurrencyFormat } from '../composables/billing.useCurrencyFormat.js';

describe('useCurrencyFormat', () => {
  it('formatPrice formats amounts as USD in en-US locale', () => {
    const { formatPrice } = useCurrencyFormat();
    expect(formatPrice(1299)).toBe('$1,299.00');
    expect(formatPrice(0)).toBe('$0.00');
    expect(formatPrice(9)).toBe('$9.00');
    expect(formatPrice(100)).toBe('$100.00');
  });

  it('formatPrice uses fixed locale (no reactivity)', () => {
    // Product is USD/en-US only — locale is no longer configurable
    const { formatPrice } = useCurrencyFormat();
    const first = formatPrice(1299);
    const second = formatPrice(1299);
    expect(first).toBe('$1,299.00');
    expect(second).toBe(first);
  });

  it('formatPrice does not throw for valid numbers', () => {
    const { formatPrice } = useCurrencyFormat();
    expect(() => formatPrice(100)).not.toThrow();
    expect(formatPrice(100)).toContain('$');
  });

  // ── NaN / non-finite guard ────────────────────────────────────────

  it('formatPrice returns em dash for invalid inputs (NaN, undefined, null, Infinity)', () => {
    const { formatPrice } = useCurrencyFormat();
    expect(formatPrice(NaN)).toBe('—');
    expect(formatPrice(undefined)).toBe('—');
    expect(formatPrice(null)).toBe('—');
    expect(formatPrice(Infinity)).toBe('—');
  });

  it('formatPrice formats negative amount correctly', () => {
    const { formatPrice } = useCurrencyFormat();
    expect(formatPrice(-100)).toBe('-$100.00');
  });
});
