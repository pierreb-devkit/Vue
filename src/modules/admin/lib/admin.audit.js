/**
 * @desc Whether the API records an audit log. Read from the server config
 * (`GET /api/auth/config` → `audit.enabled`, false when the API switches audit
 * off). Missing key (older API, config not loaded) counts as on, so the views
 * keep their previous behaviour.
 * @param {object|null|undefined} serverConfig - `useAuthStore().serverConfig`.
 * @returns {boolean} true unless the API reports `audit.enabled === false`.
 */
export const isAuditOn = (serverConfig) => serverConfig?.audit?.enabled !== false;

/**
 * Exports.
 */
export default { isAuditOn };
