/**
 * Sanitize API error messages to avoid leaking internal details (stack traces, DB paths, etc.).
 * @param {unknown} err - The caught error object.
 * @param {string} [fallback] - Message returned when the API message is missing or unsafe.
 * @param {'message'|'description'} [field] - Body field to read. The API puts the HTTP
 *   title in `message` ("Bad Request") and the human reason in `description`.
 * @returns {string} A safe, user-facing error message.
 */
export const sanitizeApiError = (err, fallback = 'Failed to load data. Please try again.', field = 'message') => {
  const raw = err?.response?.data?.[field];
  const msg = typeof raw === 'string' ? raw : '';
  if (msg && msg.length <= 200 && !/\b(collection|stack)\b|Error:|^\s*at\s+|\/[a-z]+\/|\.[jt]s:\d+/.test(msg)) {
    return msg;
  }
  return fallback;
};
