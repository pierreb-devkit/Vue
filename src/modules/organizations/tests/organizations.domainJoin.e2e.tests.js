import { test, expect } from '@playwright/test';
import { signin, signupViaAPI } from '../../../lib/helpers/e2e/auth.js';
import { authenticatedContext, createOrgViaAPI, API } from '../../../lib/helpers/e2e/api.js';

const timestamp = Date.now();
const domain = `domain${timestamp}.com`;
const ownerEmail = `e2e-djowner-${timestamp}@${domain}`;
const memberEmail = `e2e-djmember-${timestamp}@${domain}`;
const password = 'E2eTestPass99xyz';

let orgId;

/**
 * End-to-end suite for organization domain-based join flow.
 * @returns {void}
 */
test.describe('Organization Domain Join E2E', () => {
  test.describe.configure({ mode: 'serial' });

  // ── Phase 1: Signup & pending join ────────────────────────────────

  /**
   * Creates owner account and organization with domain matching.
   * @param {{ playwright: import('@playwright/test').Playwright, request: import('@playwright/test').APIRequestContext }} fixtures - Playwright fixtures
   * @returns {Promise<void>}
   */
  test('owner signs up via API and creates org', async ({ playwright, request }) => {
    const res = await signupViaAPI(request, {
      email: ownerEmail,
      password,
      firstName: 'DJOwner',
      lastName: 'Test',
    });
    expect(res.user).toBeTruthy();

    // Create org via authenticated API (domain matching uses the email domain)
    const ctx = await authenticatedContext(playwright, ownerEmail, password);
    const org = await createOrgViaAPI(ctx, `DomainOrg${timestamp}`, { domain });
    expect(org).toBeTruthy();
    orgId = org._id || org.id;
    expect(orgId).toBeTruthy();
    await ctx.dispose();
  });

  /**
   * Signs up a member with matching domain and verifies pending join message.
   * @param {{ page: import('@playwright/test').Page }} fixtures - Playwright fixtures
   * @returns {Promise<void>}
   */
  test('member signs up via UI — sees pending message, no sidenav', async ({ page }) => {
    await page.goto('/signup');
    await page.getByPlaceholder('name@example.com').first().waitFor({ state: 'visible', timeout: 10000 });

    await page.getByPlaceholder('name@example.com').first().fill(memberEmail);
    await page.getByPlaceholder('Create a password').first().fill(password);
    await page.getByRole('button', { name: 'Continue', exact: true }).click();

    // Wait for the pending join message
    const pendingText = page.locator('text=request to join').first();
    await expect(pendingText).toBeVisible({ timeout: 10000 });

    // CRITICAL: Sidenav must NOT be visible during signup
    const sidenav = page.locator('nav.v-navigation-drawer, .v-navigation-drawer');
    await expect(sidenav).toHaveCount(0, { timeout: 3000 });
  });

  /**
   * Verifies pending members are redirected to organization-required on sign-in.
   * @param {{ page: import('@playwright/test').Page }} fixtures - Playwright fixtures
   * @returns {Promise<void>}
   */
  test('member signs in — lands on organization-required', async ({ page }) => {
    await signin(page, memberEmail, password);
    await page.waitForURL((url) => url.pathname.includes('/organization-required'), { timeout: 15000 });

    // Should land on organization-required page (pending member has no active org)
    expect(page.url()).toContain('/organization-required');

    // Should see the pending request banner
    await expect(page.getByRole('alert').getByText('pending approval')).toBeVisible({ timeout: 10000 });
  });

  /**
   * Verifies logged-in member visiting signup is redirected to organization-required.
   * @param {{ page: import('@playwright/test').Page }} fixtures - Playwright fixtures
   * @returns {Promise<void>}
   */
  test('member refresh on signup — redirects to organization-required', async ({ page }) => {
    await signin(page, memberEmail, password);
    await page.waitForLoadState('domcontentloaded');

    // Navigate to signup (simulating refresh — user is already logged in)
    await page.goto('/signup');
    // Wait for Vue app to detect logged-in user and redirect to organization-required
    await page.waitForURL((url) => url.pathname.includes('/organization-required'), { timeout: 15000 });

    // Should redirect to organization-required (not show signup form again)
    expect(page.url()).toContain('/organization-required');
  });

  // ── Phase 2: Owner approves, then member access control ───────────

  /**
   * Owner approves the pending join request via API.
   * @param {{ playwright: import('@playwright/test').Playwright }} fixtures - Playwright fixtures
   * @returns {Promise<void>}
   */
  test('owner approves member join request', async ({ playwright }) => {
    // Approve via authenticated API context — the pending requests section in the
    // detail component relies on loadMembership middleware timing which is not
    // deterministic in CI.  The banner proves the API works; use it directly.
    const ctx = await authenticatedContext(playwright, ownerEmail, password);
    let requests = [];
    const deadline = Date.now() + 15000;
    while (Date.now() < deadline && requests.length === 0) {
      const reqRes = await ctx.get(`${API}/organizations/${orgId}/requests`);
      const reqBody = await reqRes.json();
      requests = reqBody.data || [];
      if (requests.length === 0) {
        await new Promise((resolve) => { setTimeout(resolve, 500); });
      }
    }
    expect(requests.length).toBeGreaterThan(0);

    const requestId = requests[0]._id || requests[0].id;
    const approveRes = await ctx.put(`${API}/organizations/${orgId}/requests/${requestId}/approve`);
    expect(approveRes.ok()).toBeTruthy();
    await ctx.dispose();
  });

  /**
   * Verifies approved member cannot see the manage chevron on account page.
   * @param {{ page: import('@playwright/test').Page }} fixtures - Playwright fixtures
   * @returns {Promise<void>}
   */
  test('approved member — no Manage button on account page', async ({ page }) => {
    await signin(page, memberEmail, password);
    await page.goto('/users');
    await page.waitForLoadState('domcontentloaded');

    // Click the Organizations tab
    const orgTab = page.getByRole('tab', { name: /organizations/i });
    await orgTab.click({ timeout: 10000 });
    await expect(page.getByText(`DomainOrg${timestamp}`, { exact: true })).toBeVisible({ timeout: 10000 });

    // Members should NOT see the chevron (manage) icon on their org item
    const chevron = page.locator('.v-list-item .fa-chevron-right');
    await expect(chevron).toHaveCount(0, { timeout: 5000 });
  });

  /**
   * Verifies approved member cannot see management controls on org detail page.
   * @param {{ page: import('@playwright/test').Page }} fixtures - Playwright fixtures
   * @returns {Promise<void>}
   */
  test('approved member — no management controls on org page', async ({ page }) => {
    await signin(page, memberEmail, password);
    await page.goto(`/users/organizations/${orgId}`);
    await expect(page.getByText(`DomainOrg${timestamp}`)).toBeVisible({ timeout: 10000 });

    // Delete button NOT visible
    const deleteButton = page.locator('button', { hasText: 'Delete' });
    await expect(deleteButton).toHaveCount(0, { timeout: 5000 });

    // Save Changes NOT visible
    const saveButton = page.locator('button', { hasText: 'Save Changes' });
    await expect(saveButton).toHaveCount(0, { timeout: 5000 });

    // Invite Member NOT visible
    const inviteSection = page.locator('text=Invite Member');
    await expect(inviteSection).toHaveCount(0, { timeout: 5000 });

    // Pending Join Requests NOT visible
    const pendingSection = page.locator('text=Pending Join Requests');
    await expect(pendingSection).toHaveCount(0, { timeout: 5000 });
  });

  /**
   * Verifies owner can see all management controls on org detail page.
   * @param {{ page: import('@playwright/test').Page }} fixtures - Playwright fixtures
   * @returns {Promise<void>}
   */
  test('owner sees full management controls', async ({ page }) => {
    await signin(page, ownerEmail, password);
    await page.goto(`/users/organizations/${orgId}`);
    await page.waitForLoadState('domcontentloaded');

    // Delete button IS visible
    const deleteButton = page.locator('button', { hasText: 'Delete' });
    await expect(deleteButton).toBeVisible({ timeout: 10000 });

    // Invite Member IS visible
    const inviteSection = page.locator('text=Invite Member');
    await expect(inviteSection).toBeVisible({ timeout: 10000 });
  });
});
