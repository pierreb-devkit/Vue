import { test, expect } from '@playwright/test';
import { API_URL } from '../../../lib/helpers/e2e/config.js';

const timestamp = Date.now();
const testEmail = `e2e-signup-${timestamp}@new${timestamp}.com`;
const testPassword = 'E2eTestPass99xyz';

test.describe('Signup E2E', () => {
  test('complete signup flow', async ({ page }) => {
    await page.goto('/signup');
    await page.getByPlaceholder('name@example.com').waitFor({ state: 'visible', timeout: 10000 });

    await page.getByPlaceholder('name@example.com').fill(testEmail);
    await page.getByPlaceholder('Create a password').fill(testPassword);
    await page.getByRole('main').getByRole('button', { name: 'Continue', exact: true }).click();

    // Wait for the signup to complete — either redirects or shows org setup step
    // With organizations enabled, the flow stays on /signup and shows the next step
    await page.waitForTimeout(3000);

    // Should not show an error — the flow proceeds
    const errorAlert = page.locator('.v-alert[type="error"]');
    const hasError = await errorAlert.count();
    expect(hasError).toBe(0);
  });

  test('can signin after signup', async ({ page }) => {
    // First signup via API to ensure user exists
    const signupRes = await page.request.post(`${API_URL}/auth/signup`, {
      data: { email: `e2e-signin-${timestamp}@test.com`, password: testPassword, firstName: 'Test', lastName: 'User' },
    });
    expect(signupRes.ok()).toBeTruthy();

    await page.goto('/signin');
    await page.getByPlaceholder('name@example.com').waitFor({ state: 'visible', timeout: 10000 });
    await page.getByPlaceholder('name@example.com').fill(`e2e-signin-${timestamp}@test.com`);
    await page.getByPlaceholder('Enter your password').fill(testPassword);
    await page.getByRole('main').getByRole('button', { name: 'Sign In' }).click();

    await page.waitForURL((url) => !url.pathname.includes('/signin'), { timeout: 15000 });
    expect(page.url()).not.toContain('/signin');
  });
});
