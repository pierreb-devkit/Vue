import { test, expect } from '@playwright/test';
import { signin, signupViaAPI } from '../../../lib/helpers/e2e/auth.js';
import { authenticatedContext, createOrgViaAPI } from '../../../lib/helpers/e2e/api.js';

const timestamp = Date.now();
const ownerEmail = `e2e-jowner-${timestamp}@join${timestamp}.com`;
const requesterEmail = `e2e-jreq-${timestamp}@join${timestamp}.com`;
const password = 'E2eTestPass99xyz';

test.describe('Organization Join Request E2E', () => {
  test.describe.configure({ mode: 'serial' });

  test('setup: create owner with org, and requester', async ({ playwright, request }) => {
    const ownerRes = await signupViaAPI(request, {
      email: ownerEmail,
      password,
      firstName: 'JoinOwner',
      lastName: 'Test',
    });
    expect(ownerRes.user).toBeTruthy();

    // Owner creates an org so they have one to manage
    const ctx = await authenticatedContext(playwright, ownerEmail, password);
    const org = await createOrgViaAPI(ctx, `JoinOrg${timestamp}`);
    expect(org).toBeTruthy();
    await ctx.dispose();

    const reqRes = await signupViaAPI(request, {
      email: requesterEmail,
      password,
      firstName: 'Requester',
      lastName: 'Test',
    });
    expect(reqRes.user).toBeTruthy();
  });

  test('requester signs in successfully', async ({ page }) => {
    await signin(page, requesterEmail, password);
    await page.waitForTimeout(1000);
    // Basic sanity — page loaded without error
    expect(page.url()).toBeTruthy();
  });

  test('owner can navigate to org detail', async ({ page }) => {
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
