import { test, expect } from '@playwright/test';
import { signin, signupViaAPI } from '../../../lib/helpers/e2e/auth.js';
import {
  authenticatedContext,
  createOrgViaAPI,
  isApiAvailable,
  errorMessage,
  CONNECTIVITY_ERROR_RE,
} from '../../../lib/helpers/e2e/api.js';

const timestamp = Date.now();
const ownerEmail = `e2e-jowner-${timestamp}@join${timestamp}.com`;
const requesterEmail = `e2e-jreq-${timestamp}@join${timestamp}.com`;
const password = 'E2eTestPass99xyz';

let orgId;

test.describe('Organization Join Request E2E', () => {
  test.describe.configure({ mode: 'serial' });

  // The API origin is read from the shared e2e config helper (via authenticatedContext /
  // createOrgViaAPI / signupViaAPI, all sourced from API_URL) — never hardcoded here.
  // The live-backend prerequisite is explicit: check it, and skip (not fail) when absent,
  // matching organizations.domainJoin.e2e.tests.js's established pattern.
  test('setup: create owner with org, and requester', async ({ playwright, request }) => {
    const apiUp = await isApiAvailable(request);
    test.skip(!apiUp, 'Node API backend not running');

    let ownerRes;
    try {
      ownerRes = await signupViaAPI(request, {
        email: ownerEmail,
        password,
        firstName: 'JoinOwner',
        lastName: 'Test',
      });
    } catch (err) {
      const msg = errorMessage(err);
      if (CONNECTIVITY_ERROR_RE.test(msg)) {
        test.skip(true, `API connection failed during signup: ${msg}`);
        return;
      }
      throw err;
    }
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
    test.skip(!orgId, 'Setup was skipped — no org created');
    await signin(page, requesterEmail, password);
    await page.waitForLoadState('domcontentloaded');
    // Basic sanity — page loaded without error
    expect(page.url()).not.toContain('/signin');
  });

  test('owner can navigate to org detail', async ({ page }) => {
    test.skip(!orgId, 'Setup was skipped — no org created');
    await signin(page, ownerEmail, password);
    await page.goto(`/users/organizations/${orgId}`);

    // Should see the org detail page
    await expect(page.locator(`text=JoinOrg`).first()).toBeVisible({ timeout: 10000 });
    expect(page.url()).toContain('/users/organizations/');
  });
});
