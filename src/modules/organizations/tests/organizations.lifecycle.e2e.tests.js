import { test, expect } from '@playwright/test';
import { signin, signupViaAPI } from '../../../lib/helpers/e2e/auth.js';
import { authenticatedContext, createOrgViaAPI } from '../../../lib/helpers/e2e/api.js';

const timestamp = Date.now();
const ownerEmail = `e2e-owner-${timestamp}@lifecycle${timestamp}.com`;
const password = 'E2eTestPass99xyz';

let orgId;

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

  test('owner creates a new org', async ({ playwright }) => {
    const ctx = await authenticatedContext(playwright, ownerEmail, password);
    const org = await createOrgViaAPI(ctx, `LifecycleOrg${timestamp}`);
    expect(org).toBeTruthy();
    orgId = org._id || org.id;
    expect(orgId).toBeTruthy();
    await ctx.dispose();
  });

  test('owner can view org detail via manage', async ({ page }) => {
    await signin(page, ownerEmail, password);
    await page.goto(`/users/organizations/${orgId}`);

    // Should see the org detail page
    await expect(page.locator('text=LifecycleOrg')).toBeVisible({ timeout: 10000 });
    expect(page.url()).toContain('/users/organizations/');
  });
});
