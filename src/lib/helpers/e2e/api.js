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

export { API };
