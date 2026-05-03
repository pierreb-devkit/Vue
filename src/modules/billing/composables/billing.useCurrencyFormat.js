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
   * @param {number} amount - Price in dollars (major units)
   * @returns {string} Formatted price string (e.g. '$1,299.00')
   */
  function formatPrice(amount) {
    return new Intl.NumberFormat(locale.value, { style: 'currency', currency: 'USD' }).format(amount);
  }

  return { formatPrice };
}

/**
 * Exports.
 */
export default useCurrencyFormat;
