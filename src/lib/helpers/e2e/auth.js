/**
 * @desc Sign in a user via the UI
 * @param {import('@playwright/test').Page} page
 * @param {string} email
 * @param {string} password
 * @returns {Promise<void>}
 */
export async function signin(page, email, password) {
  await page.goto('/signin');
  await page.getByPlaceholder('name@example.com').waitFor({ state: 'visible', timeout: 10000 });
  await page.getByPlaceholder('name@example.com').fill(email);
  await page.getByPlaceholder('Enter your password').fill(password);
  await page.getByRole('main').getByRole('button', { name: 'Sign In' }).click();
  await page.waitForTimeout(1500);
}

/**
 * @desc Sign up a user via the API directly (faster than UI)
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {Object} user - { email, password, firstName, lastName }
 * @returns {Promise<Object>} signup response data
 */
export async function signupViaAPI(request, { email, password, firstName, lastName }) {
  const res = await request.post('http://localhost:3000/api/auth/signup', {
    data: { email, password, firstName: firstName || 'Test', lastName: lastName || 'User' },
  });
  const body = await res.json();
  if (!res.ok()) {
    throw new Error(`Signup failed (${res.status()}): ${JSON.stringify(body)}`);
  }
  return body;
}

/**
 * @desc Sign in via API and return response data
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} email
 * @param {string} password
 * @returns {Promise<Object>}
 */
export async function signinViaAPI(request, email, password) {
  const res = await request.post('http://localhost:3000/api/auth/signin', {
    data: { email, password },
  });
  const body = await res.json();
  if (!res.ok()) {
    throw new Error(`Signin failed (${res.status()}): ${JSON.stringify(body)}`);
  }
  return body;
}
