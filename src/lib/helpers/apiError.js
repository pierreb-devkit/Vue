/**
 * Sanitize API error messages to avoid leaking internal details (stack traces, DB paths, etc.).
 * @param {unknown} err - The caught error object.
 * @returns {string} A safe, user-facing error message.
 */
export const sanitizeApiError = (err) => {
  const msg = err?.response?.data?.message || '';
  if (msg && msg.length <= 200 && !/\b(collection|stack)\b|Error:|^\s*at\s+|\/[a-z]+\/|\.[jt]s:\d+/.test(msg)) {
    return msg;
  }
  return 'Failed to load data. Please try again.';
};
