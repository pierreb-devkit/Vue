/**
 * billing.useCurrencyFormat
 * =========================
 * Composable for formatting monetary amounts using Intl.NumberFormat.
 * Currency is hardcoded to USD / en-US — no multi-currency or locale support.
 *
 * USAGE:
 *   const { formatPrice } = useCurrencyFormat()
 *   formatPrice(1299) // '$1,299.00'
 *
 * NOTE: `amount` is expected in major units (dollars), not cents.
 */

const CURRENCY = 'USD';
const LOCALE = 'en-US';
const fmt = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: CURRENCY });

/**
 * @returns {{ formatPrice: (amount: number) => string }}
 */
export function useCurrencyFormat() {
  /**
   * @desc Format a price amount as USD currency string using fixed en-US locale.
   * Returns '—' for non-finite inputs (NaN, Infinity, undefined, null) — defensive only,
   * callers are expected to pass valid dollar amounts.
   * @param {number} amount - Price in dollars (major units)
   * @returns {string} Formatted price string (e.g. '$1,299.00') or '—' for invalid input
   */
  function formatPrice(amount) {
    if (typeof amount !== 'number' || !Number.isFinite(amount)) {
      return '—'; // em dash — non-finite amount is not a valid price
    }
    return fmt.format(amount);
  }

  return { formatPrice };
}

/**
 * Exports.
 */
export default useCurrencyFormat;
