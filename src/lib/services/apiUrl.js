/**
 * Pure API URL formatter.
 * No imports — safe to use from contexts that cannot pull in the app config
 * (e.g. the E2E harness, which resolves protocol/host/port/base on its own
 * with fallbacks before the app config exists).
 */

/**
 * @param {{ protocol: string, host: string, port: number|string, base: string }} parts
 * @returns {string} The `protocol://host:port/base` prefix (e.g. `http://localhost:3000/api`).
 */
export const formatApiUrl = ({ protocol, host, port, base }) => `${protocol}://${host}:${port}/${base}`;
