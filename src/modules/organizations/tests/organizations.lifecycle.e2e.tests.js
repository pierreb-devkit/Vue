import { test, expect } from '@playwright/test';
import { signin, signupViaAPI } from '../../../lib/helpers/e2e/auth.js';

const timestamp = Date.now();
const ownerEmail = `e2e-owner-${timestamp}@lifecycle${timestamp}.com`;
const password = 'E2eTestPass99xyz';

test.describe('Organization Lifecycle E2E', () => {
  test.describe.configure({ mode: 'serial' });

  test('owner signs up via API', async ({ request }) => {
    const res = await signupViaAPI(request, {
      email: ownerEmail,
      password,
      firstName: 'Owner',
      lastName: 'Test',
    });
    expect(res.user).toBeTruthy();
  });

  test('owner creates a new org', async ({ page }) => {
    await signin(page, ownerEmail, password);
    await page.goto('/users/organizations/create');
    await page.waitForTimeout(1000);

    const nameInput = page.locator('input').first();
    await nameInput.fill(`LifecycleOrg${timestamp}`);
    await page.getByRole('button', { name: /create/i }).click();

    await page.waitForURL((url) => url.pathname.includes('/users/organizations'), { timeout: 10000 });
    expect(page.url()).toContain('/users/organizations');
  });

  test('owner can view org detail via manage', async ({ page }) => {
    await signin(page, ownerEmail, password);
    await page.goto('/users');
    await page.waitForTimeout(2000);

    // Click the Organizations tab
    const orgTab = page.getByRole('tab', { name: /organizations/i });
    await orgTab.click({ timeout: 10000 });
    await page.waitForTimeout(2000);

    // Click the org list item in the main content (owners see a clickable link)
    const orgItem = page.getByRole('main').locator('.v-list-item').first();
    await orgItem.click({ timeout: 10000 });
    await page.waitForTimeout(1500);

    expect(page.url()).toContain('/users/organizations/');
  });
});
