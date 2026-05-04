/**
 * billing.useCurrencyFormat
 * =========================
 * Composable for formatting monetary amounts using Intl.NumberFormat.
 * Currency is hardcoded to USD — no multi-currency support.
 *
 * USAGE:
 *   const { formatPrice } = useCurrencyFormat()
 *   formatPrice(1299) // '$1,299.00' (en) or '1 299,00 $US' (fr)
 *
 * NOTE: `amount` is expected in major units (dollars), not cents.
 */

/**
 * Module dependencies.
 */
import { useI18n } from 'vue-i18n';

/**
 * @returns {{ formatPrice: (amount: number) => string }}
 */
export function useCurrencyFormat() {
  const { locale } = useI18n();

  /**
   * @desc Format a price amount as USD currency string using locale-aware Intl.NumberFormat.
   * Falls back to 'en-US' when locale is null, undefined, empty, or an invalid BCP47 tag
   * (RangeError from Intl.NumberFormat is caught and retried with 'en-US').
   * Returns '—' for non-finite inputs (NaN, Infinity, undefined, null) — defensive only,
   * callers are expected to pass valid dollar amounts.
   * @param {number} amount - Price in dollars (major units)
   * @returns {string} Formatted price string (e.g. '$1,299.00') or '—' for invalid input
   */
  function formatPrice(amount) {
    if (typeof amount !== 'number' || !Number.isFinite(amount)) {
      return '—'; // em dash — non-finite amount is not a valid price
    }
    const localeStr = locale.value || 'en-US';
    try {
      return new Intl.NumberFormat(localeStr, { style: 'currency', currency: 'USD' }).format(amount);
    } catch {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    }
  }

  return { formatPrice };
}

/**
 * Exports.
 */
export default useCurrencyFormat;
