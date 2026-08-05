import { API_URL } from './config.js';

const API = API_URL;

/**
 * @desc Patterns identifying a backend-unreachable / transport-level failure.
 * Scope `test.skip` to these so real backend regressions (4xx/5xx, schema drift,
 * etc.) surface as failures instead of silently skipping.
 * @type {RegExp}
 */
export const CONNECTIVITY_ERROR_RE = /ECONNREFUSED|ENOTFOUND|ETIMEDOUT|EAI_AGAIN|fetch failed|socket hang up|network error/i;

/**
 * @desc Safely extract a string message from an unknown thrown value.
 * @param {unknown} err
 * @returns {string}
 */
export function errorMessage(err) {
  return err instanceof Error ? err.message : String(err);
}

/**
 * @desc Check whether the Node API backend is reachable at the transport level.
 * Reachability = a response came back at all (any HTTP status) — a 4xx/5xx means
 * the backend IS running and answered, so callers should NOT skip and should let
 * the test exercise the real code path. Only network/connection errors (the
 * request itself throws) indicate the backend is genuinely unreachable — the
 * explicit env prerequisite an org-flow E2E test depends on.
 * @param {import('@playwright/test').APIRequestContext} request
 * @returns {Promise<boolean>}
 */
export async function isApiAvailable(request) {
  try {
    await request.get(API);
    return true;
  } catch {
    return false;
  }
}

/**
 * @desc Create an authenticated API request context
 * @param {import('@playwright/test').Playwright} playwright - Playwright instance
 * @param {string} email
 * @param {string} password
 * @returns {Promise<import('@playwright/test').APIRequestContext>}
 */
export async function authenticatedContext(playwright, email, password) {
  const context = await playwright.request.newContext();
  await context.post(`${API}/auth/signin`, {
    data: { email, password },
  });
  return context;
}

/**
 * @desc Create an organization via the API (requires authenticated context)
 * @param {import('@playwright/test').APIRequestContext} context - Authenticated request context
 * @param {string} name - Organization name
 * @param {Object} [extra] - Optional extra fields (e.g. { domain: 'example.com' })
 * @returns {Promise<Object>} created organization
 */
export async function createOrgViaAPI(context, name, extra = {}) {
  const res = await context.post(`${API}/organizations`, {
    data: { name, ...extra },
  });
  const body = await res.json();
  if (!res.ok()) {
    throw new Error(`Create org failed (${res.status()}): ${JSON.stringify(body)}`);
  }
  if (!body?.data) {
    throw new Error(`Create org response missing data envelope: ${JSON.stringify(body)}`);
  }
  return body.data;
}

export { API };
