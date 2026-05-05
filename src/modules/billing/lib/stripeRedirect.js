/**
 * Stripe redirect URL validation helper.
 * Centralises host-whitelist enforcement for all Stripe redirect URLs so that
 * a malicious or misconfigured API response cannot redirect users off-Stripe.
 */

/**
 * @type {string[]} Allowed Stripe redirect hostnames.
 */
const ALLOWED_HOSTS = ['checkout.stripe.com', 'billing.stripe.com'];

/**
 * @desc Validate a URL returned by the API before redirecting the browser to it.
 * Accepts only HTTPS URLs whose hostname is on the Stripe allow-list.
 * @param {string} url - The URL to validate.
 * @returns {string} The normalised URL string (safe to pass to window.location.assign).
 * @throws {Error} When the URL is empty, unparseable, non-HTTPS, or off-whitelist.
 */
export function validateStripeUrl(url) {
  if (typeof url !== 'string' || !url) {
    throw new Error('Stripe URL is empty');
  }
  let parsed;
  try {
    parsed = new URL(url); // throws on relative URLs and invalid strings
  } catch {
    throw new Error('Stripe URL is invalid');
  }
  if (parsed.protocol !== 'https:') {
    throw new Error('Stripe URL must use HTTPS');
  }
  if (parsed.username || parsed.password) {
    throw new Error('Stripe URL must not contain credentials');
  }
  if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
    throw new Error(`Stripe URL host not allowed: ${parsed.hostname}`);
  }
  return parsed.toString();
}

/**
 * Exports.
 */
export default validateStripeUrl;
