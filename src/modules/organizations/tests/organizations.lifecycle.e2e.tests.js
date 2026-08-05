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
const ownerEmail = `e2e-owner-${timestamp}@lifecycle${timestamp}.com`;
const password = 'E2eTestPass99xyz';

let orgId;
let setupOk = false;

/**
 * @desc End-to-end suite covering the organization lifecycle: owner signup, org creation,
 * and viewing the org detail page — each step skips gracefully (never hard-fails) when the
 * live Node API backend prerequisite isn't met.
 * @returns {void}
 */
test.describe('Organization Lifecycle E2E', () => {
  test.describe.configure({ mode: 'serial' });

  /**
   * @desc Sign up the owner user via API helper. The API origin is read from the
   * shared e2e config helper (via signupViaAPI → API_URL) — never hardcoded here.
   * The live-backend prerequisite is explicit: check it, and skip (not fail) when
   * absent, matching organizations.domainJoin.e2e.tests.js's established pattern.
   * @param {{ request: import('playwright').APIRequestContext }} fixtures
   * @returns {Promise<void>}
   */
  test('owner signs up via API', async ({ request }) => {
    const apiUp = await isApiAvailable(request);
    test.skip(!apiUp, 'Node API backend not running');

    let res;
    try {
      res = await signupViaAPI(request, {
        email: ownerEmail,
        password,
        firstName: 'Owner',
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
    expect(res.user).toBeTruthy();
    setupOk = true;
  });

  /**
   * @desc Create a new organization via API as the authenticated owner.
   * @param {{ playwright: import('playwright').Playwright }} fixtures
   * @returns {Promise<void>}
   */
  test('owner creates a new org', async ({ playwright }) => {
    test.skip(!setupOk, 'Setup was skipped — owner signup did not complete');
    const ctx = await authenticatedContext(playwright, ownerEmail, password);
    const org = await createOrgViaAPI(ctx, `LifecycleOrg${timestamp}`);
    expect(org).toBeTruthy();
    orgId = org._id || org.id;
    expect(orgId).toBeTruthy();
    await ctx.dispose();
  });

  /**
   * @desc Verify the owner can view the org detail page after signing in.
   * @param {{ page: import('playwright').Page }} fixtures
   * @returns {Promise<void>}
   */
  test('owner can view org detail via manage', async ({ page }) => {
    test.skip(!orgId, 'Setup was skipped — no org created');
    await signin(page, ownerEmail, password);
    await page.goto(`/users/organizations/${orgId}`);

    // Should see the org detail page (use heading role to avoid tooltip duplicates)
    await expect(page.getByRole('heading', { name: /LifecycleOrg/ })).toBeVisible({ timeout: 10000 });
    expect(page.url()).toContain('/users/organizations/');
  });
});
