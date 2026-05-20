import { test, expect } from '@playwright/test';
import { signin, signupViaAPI } from '../../../lib/helpers/e2e/auth.js';
import { authenticatedContext, createOrgViaAPI, API } from '../../../lib/helpers/e2e/api.js';
import { API_URL, COOKIE_PREFIX } from '../../../lib/helpers/e2e/config.js';

/**
 * @desc Patterns that identify a backend-unreachable / transport-level failure.
 * Used to scope `test.skip` so real backend regressions (4xx/5xx, schema drift,
 * etc.) surface as failures instead of silent skips.
 * @type {RegExp}
 */
const CONNECTIVITY_ERROR_RE = /ECONNREFUSED|ENOTFOUND|ETIMEDOUT|EAI_AGAIN|fetch failed|socket hang up|network error/i;

/**
 * @desc Safely extract a string message from an unknown thrown value.
 * Avoids crashing when something throws `null` / `undefined` / a non-Error.
 * @param {unknown} err
 * @returns {string}
 */
function errorMessage(err) {
  if (err instanceof Error) return err.message;
  if (err == null) return String(err);
  return typeof err === 'string' ? err : String(err);
}

const timestamp = Date.now();
const domain = `domain${timestamp}.com`;
const ownerEmail = `e2e-djowner-${timestamp}@${domain}`;
const memberEmail = `e2e-djmember-${timestamp}@${domain}`;
const password = 'E2eTestPass99xyz';

let orgId;

/**
 * @desc Check whether the Node API backend is reachable at the transport level.
 * Reachability = a response came back at all (any HTTP status). A 4xx/5xx means
 * the backend IS running and answered — so we should NOT skip the suite; we
 * should let the test exercise the real code path. Only network/connection
 * errors (request.get throws) indicate the backend is genuinely unreachable.
 * @param {import('@playwright/test').APIRequestContext} request
 * @returns {Promise<boolean>}
 */
async function isApiAvailable(request) {
  try {
    // Use the fully-configured API URL (honors api.protocol/host/port/base) so
    // we don't false-negative on projects that customize `config.api.base`.
    await request.get(API_URL);
    return true;
  } catch {
    return false;
  }
}

/**
 * @desc Predicate for `page.waitForURL` — true once the SPA has left the auth /
 * onboarding limbo (signup wizard, signin, or organization-required). Used by
 * every post-auth navigation wait in this suite; the post-auth destination
 * varies by env (test=`/`, dev=`/tasks`) so we assert by EXCLUSION instead.
 * @param {URL} url
 * @returns {boolean}
 */
function isPostSignupRoute(url) {
  const p = url.pathname;
  return !p.includes('/signup') && !p.includes('/signin') && !p.includes('/organization-required');
}

/**
 * @desc Seed the `suggestedJoin` localStorage entry on every page-load in a
 * Playwright context. Used to replicate what the signup flow stores so the
 * banner renders deterministically on subsequent signin tests.
 * @param {[string, string, string]} args - [storageKey, orgId, orgName]
 * @returns {void}
 */
function seedSuggestedJoinLocalStorage([key, id, name]) {
  window.localStorage.setItem(key, JSON.stringify({ orgId: id, orgName: name }));
}

/**
 * End-to-end suite for organization domain-based join flow.
 *
 * Node #3680 (D5 always-create): domain-match signup no longer creates a pending
 * join request. Every user always gets their own active workspace. A `suggestedJoin`
 * hint ({ orgId, orgName }) is returned alongside the new workspace when the email
 * domain matches an existing org. The Vue app surfaces it as a dismissible snackbar
 * banner ("There may already be a workspace for X. Request access?").
 * @returns {void}
 */
test.describe('Organization Domain Join E2E', () => {
  test.describe.configure({ mode: 'serial' });

  // ── Phase 1: Signup & always-create workspace ─────────────────────

  /**
   * Creates owner account and organization with domain matching.
   * @param {{ playwright: import('@playwright/test').Playwright, request: import('@playwright/test').APIRequestContext }} fixtures - Playwright fixtures
   * @returns {Promise<void>}
   */
  test('owner signs up via API and creates org', async ({ playwright, request }) => {
    const apiUp = await isApiAvailable(request);
    test.skip(!apiUp, 'Node API backend not running');

    let res;
    try {
      res = await signupViaAPI(request, {
        email: ownerEmail,
        password,
        firstName: 'DJOwner',
        lastName: 'Test',
      });
    } catch (err) {
      // Skip ONLY on infra-level connectivity failures so real backend
      // regressions (4xx/5xx, schema drift) surface as failures, not silent skips.
      const msg = errorMessage(err);
      if (CONNECTIVITY_ERROR_RE.test(msg)) {
        test.skip(true, `API connection failed during signup: ${msg}`);
        return;
      }
      throw err;
    }
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
   * Spec D5: member signs up with a matching domain.
   * Always-create: member lands in the organizationWelcome step ("Welcome! Your
   * organization X has been created.") — NOT a "request to join" pending message.
   * Sidenav is still absent during the signup wizard.
   * @param {{ page: import('@playwright/test').Page }} fixtures - Playwright fixtures
   * @returns {Promise<void>}
   */
  test('member signs up via UI — lands in own workspace, sees welcome step (no "request to join")', async ({ page }) => {
    test.skip(!orgId, 'Setup was skipped — no org created');
    await page.goto('/signup');
    await page.getByPlaceholder('name@example.com').first().waitFor({ state: 'visible', timeout: 10000 });

    await page.getByPlaceholder('name@example.com').first().fill(memberEmail);
    await page.getByPlaceholder('Create a password').first().fill(password);
    await page.getByRole('button', { name: 'Continue', exact: true }).click();

    // D5: member gets their own workspace — "Welcome!" message appears, NOT "request to join"
    const welcomeText = page.locator('text=Welcome!').first();
    await expect(welcomeText).toBeVisible({ timeout: 15000 });

    // The old "request to join" pending message must NOT appear
    const pendingText = page.locator('text=request to join').first();
    await expect(pendingText).not.toBeVisible({ timeout: 3000 });

    // NOTE: Unlike the old pendingJoin flow, the sidenav IS present during the
    // organizationWelcome step because the user has an active workspace (always-create).
    // The old "no sidenav" invariant no longer applies.

    // Proceed to the app to complete signup (required so member has a session for later tests)
    await page.getByRole('button', { name: 'Get Started', exact: true }).click();
    // Post-auth destination varies by env (test=`/`, dev=`/tasks`) — use the
    // env-agnostic `isPostSignupRoute` helper (defined at module top) to assert
    // by exclusion (left signup/signin/organization-required).
    await page.waitForURL(isPostSignupRoute, { timeout: 15000 });
  });

  /**
   * Spec D5: member signs in — lands on the main app (has currentOrganization).
   * Router no longer redirects to /organization-required.
   * @param {{ page: import('@playwright/test').Page }} fixtures - Playwright fixtures
   * @returns {Promise<void>}
   */
  test('member signs in — lands on main app (not organization-required)', async ({ page }) => {
    test.skip(!orgId, 'Setup was skipped — no org created');
    await signin(page, memberEmail, password);

    // D5: member has currentOrganization → router sends to /tasks, NOT /organization-required
    // Post-auth destination varies by env (test=`/`, dev=`/tasks`) — use the
    // env-agnostic `isPostSignupRoute` helper (defined at module top) to assert
    // by exclusion (left signup/signin/organization-required).
    await page.waitForURL(isPostSignupRoute, { timeout: 15000 });
    // Post-auth route varies by env (test='/' vs dev='/tasks'); assert by exclusion.
    expect(page.url()).not.toContain('/signup');
    expect(page.url()).not.toContain('/signin');
    expect(page.url()).not.toContain('/organization-required');
  });

  /**
   * Spec D5: member who is already logged in visiting /signup is redirected to the app.
   * With always-create (currentOrganization is set), the router sends to /tasks.
   * @param {{ page: import('@playwright/test').Page }} fixtures - Playwright fixtures
   * @returns {Promise<void>}
   */
  test('member refresh on signup — redirects to main app (not organization-required)', async ({ page }) => {
    test.skip(!orgId, 'Setup was skipped — no org created');
    await signin(page, memberEmail, password);
    await page.waitForLoadState('domcontentloaded');

    // Navigate to signup (simulating refresh — user is already logged in)
    await page.goto('/signup');
    // D5: member has currentOrganization → redirected to /tasks, NOT /organization-required
    // Post-auth destination varies by env (test=`/`, dev=`/tasks`) — use the
    // env-agnostic `isPostSignupRoute` helper (defined at module top) to assert
    // by exclusion (left signup/signin/organization-required).
    await page.waitForURL(isPostSignupRoute, { timeout: 15000 });

    // Post-auth route varies by env (test='/' vs dev='/tasks'); assert by exclusion.
    expect(page.url()).not.toContain('/signup');
    expect(page.url()).not.toContain('/signin');
    expect(page.url()).not.toContain('/organization-required');
  });

  // ── Phase 2: suggestedJoin banner CTA → join request + access control ─

  /**
   * Member clicks 'Request access' on the suggestedJoin banner.
   * Pre-populates localStorage with the suggestedJoin hint (simulating what the signup
   * flow stored) so the banner renders on the next page load.
   * A pending join request is created on the domain-matched owner org.
   * @param {{ page: import('@playwright/test').Page, playwright: import('@playwright/test').Playwright }} fixtures - Playwright fixtures
   * @returns {Promise<void>}
   */
  test('member clicks Request access on suggestedJoin banner — join request created', async ({ page, playwright }) => {
    test.skip(!orgId, 'Setup was skipped — no org created');

    // Inject suggestedJoin into localStorage before every page load via addInitScript.
    // This ensures initFromStorage() reads the key on the /signin page mount,
    // before the user credentials are submitted and the SPA navigates to the home.
    // Replicates what signup stores: key = `${config.cookie.prefix}SuggestedJoin`.
    // COOKIE_PREFIX is sourced from the same config the SPA reads, so the key matches
    // even if a project overrides `config.cookie.prefix`.
    const storageKey = `${COOKIE_PREFIX}SuggestedJoin`;
    await page.context().addInitScript(seedSuggestedJoinLocalStorage, [storageKey, orgId, `DomainOrg${timestamp}`]);

    await signin(page, memberEmail, password);
    // Post-auth destination varies by env (test=`/`, dev=`/tasks`) — use the
    // env-agnostic `isPostSignupRoute` helper (defined at module top) to assert
    // by exclusion (left signup/signin/organization-required).
    await page.waitForURL(isPostSignupRoute, { timeout: 15000 });

    // suggestedJoin snackbar banner must be visible (top-right v-snackbar)
    // Banner text: "There may already be a workspace for {orgName}. Request access?"
    const requestBtn = page.getByRole('button', { name: 'Request access' }).first();
    await expect(requestBtn).toBeVisible({ timeout: 10000 });
    await requestBtn.click();

    // After sending, the banner shows a success feedback snackbar and dismisses
    const feedbackText = page.locator('text=Request sent').first();
    await expect(feedbackText).toBeVisible({ timeout: 10000 });

    // Verify the join request was created on the backend
    const ctx = await authenticatedContext(playwright, ownerEmail, password);
    const reqRes = await ctx.get(`${API}/organizations/${orgId}/requests`);
    const reqBody = await reqRes.json();
    const requests = reqBody.data || [];
    expect(requests.length).toBeGreaterThan(0);
    await ctx.dispose();
  });

  /**
   * Owner approves the pending join request via API.
   * @param {{ playwright: import('@playwright/test').Playwright }} fixtures - Playwright fixtures
   * @returns {Promise<void>}
   */
  test('owner approves member join request', async ({ playwright }) => {
    test.skip(!orgId, 'Setup was skipped — no org created');
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
   * Verifies approved member cannot navigate into the domain-org (no manage chevron).
   * With always-create (Node #3680), the member owns their own auto-created workspace
   * (chevron IS present for it), but has role 'member' on DomainOrg (no chevron there).
   * @param {{ page: import('@playwright/test').Page }} fixtures - Playwright fixtures
   * @returns {Promise<void>}
   */
  test('approved member — no Manage button on account page', async ({ page }) => {
    test.skip(!orgId, 'Setup was skipped — no org created');
    await signin(page, memberEmail, password);
    await page.goto('/users');
    await page.waitForLoadState('domcontentloaded');

    // Click the Organizations tab
    const orgTab = page.getByRole('tab', { name: /organizations/i });
    await orgTab.click({ timeout: 10000 });

    // Wait for the domain org list item to appear
    const domainOrgItem = page.locator('.v-list-item', { hasText: `DomainOrg${timestamp}` });
    await expect(domainOrgItem).toBeVisible({ timeout: 10000 });

    // The domain org list item should NOT have a chevron (member role, not owner/admin)
    const chevronInDomainOrg = domainOrgItem.locator('.fa-chevron-right');
    await expect(chevronInDomainOrg).toHaveCount(0, { timeout: 5000 });
  });

  /**
   * Verifies approved member cannot see management controls on org detail page.
   * @param {{ page: import('@playwright/test').Page }} fixtures - Playwright fixtures
   * @returns {Promise<void>}
   */
  test('approved member — no management controls on org page', async ({ page }) => {
    test.skip(!orgId, 'Setup was skipped — no org created');
    await signin(page, memberEmail, password);
    await page.goto(`/users/organizations/${orgId}`);
    await expect(page.getByRole('heading', { name: `DomainOrg${timestamp}` })).toBeVisible({ timeout: 10000 });

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
    test.skip(!orgId, 'Setup was skipped — no org created');
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
