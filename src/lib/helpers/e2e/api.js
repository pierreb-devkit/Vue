const API = 'http://localhost:3000/api';

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
