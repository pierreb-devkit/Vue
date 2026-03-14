import { test, expect } from '@playwright/test';
import { signin, signupViaAPI } from '../../../lib/helpers/e2e/auth.js';
import { authenticatedContext, createOrgViaAPI } from '../../../lib/helpers/e2e/api.js';

const timestamp = Date.now();
const ownerEmail = `e2e-jowner-${timestamp}@join${timestamp}.com`;
const requesterEmail = `e2e-jreq-${timestamp}@join${timestamp}.com`;
const password = 'E2eTestPass99xyz';

let orgId;

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
    orgId = org._id || org.id;
    expect(orgId).toBeTruthy();
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
    await page.waitForLoadState('domcontentloaded');
    // Basic sanity — page loaded without error
    expect(page.url()).not.toContain('/signin');
  });

  test('owner can navigate to org detail', async ({ page }) => {
    await signin(page, ownerEmail, password);
    await page.goto(`/users/organizations/${orgId}`);

    // Should see the org detail page
    await expect(page.locator(`text=JoinOrg`).first()).toBeVisible({ timeout: 10000 });
    expect(page.url()).toContain('/users/organizations/');
  });
});
