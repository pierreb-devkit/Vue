import { test, expect } from '@playwright/test';
import { signin, signupViaAPI } from '../../../lib/helpers/e2e/auth.js';
import { authenticatedContext, createOrgViaAPI, API } from '../../../lib/helpers/e2e/api.js';

/**
 * Billing E2E strategy:
 * - Option B: gate the entire live billing suite behind RUN_BILLING_E2E=1.
 * - The suite targets a real Node API plus organization-aware auth flow, so it
 *   should either run in a prepared environment or stay fully skipped.
 * - Run locally with:
 *   RUN_BILLING_E2E=1 npm run test:e2e -- src/modules/billing/tests/billing.e2e.tests.js
 */
const billingDescribe = globalThis.process?.env.RUN_BILLING_E2E === '1'
  ? test.describe
  : test.describe.skip;

const timestamp = Date.now();
const testEmail = `e2e-billing-${timestamp}@billing${timestamp}.com`;
const testPassword = 'E2eTestPass99xyz';

/**
 * @desc Mock plans returned by the billing API for E2E tests.
 * @type {Array<Object>}
 */
const mockPlans = [
  { planId: 'free', name: 'Free', monthlyPrice: 0, annualPrice: 0, stripePriceMonthly: 'price_free_m', stripePriceAnnual: 'price_free_a' },
  { planId: 'starter', name: 'Starter', monthlyPrice: 19, annualPrice: 180, stripePriceMonthly: 'price_starter_m', stripePriceAnnual: 'price_starter_a' },
  { planId: 'pro', name: 'Pro', monthlyPrice: 49, annualPrice: 468, stripePriceMonthly: 'price_pro_m', stripePriceAnnual: 'price_pro_a' },
];

/**
 * @desc Intercept billing plans API and return mock data.
 * @param {import('playwright').Page} page - Page under test
 * @returns {Promise<void>}
 */
async function mockPlansAPI(page) {
  await page.route('**/api/billing/plans', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: mockPlans }) }),
  );
}

/**
 * @desc Switch the authenticated user into the given organization.
 * @param {import('@playwright/test').APIRequestContext} context - Authenticated request context
 * @param {string} organizationId - Organization identifier
 * @returns {Promise<void>}
 */
async function switchOrganizationViaAPI(context, organizationId) {
  const res = await context.post(`${API}/organizations/${organizationId}/switch`);
  const body = await res.json().catch(() => ({}));

  if (!res.ok()) {
    throw new Error(`Switch org failed (${res.status()}): ${JSON.stringify(body)}`);
  }
}

billingDescribe('Pricing Page E2E', () => {
  /**
   * @desc Verify the pricing page renders with header and plan cards.
   * @param {{ page: import('playwright').Page }} fixtures
   * @returns {Promise<void>}
   */
  test('displays pricing header and plan cards', async ({ page }) => {
    await mockPlansAPI(page);
    await page.goto('/pricing');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByRole('heading', { name: 'Pricing' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Free' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Starter' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Pro' })).toBeVisible();
    await expect(page.locator('.billing-pricing-card')).toHaveCount(3);
    await expect(page.getByText('Most Popular')).toBeVisible();
  });

  /**
   * @desc Verify the billing toggle switches between monthly and annual.
   * @param {{ page: import('playwright').Page }} fixtures
   * @returns {Promise<void>}
   */
  test('billing toggle switches between monthly and annual', async ({ page }) => {
    await mockPlansAPI(page);
    await page.goto('/pricing');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByText('Monthly')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Annual')).toBeVisible();
    await expect(page.getByText('Save 20%')).not.toBeVisible();

    const toggle = page.locator('.v-switch input[type="checkbox"]');
    await toggle.click({ force: true });
    await expect(page.getByText('Save 20%')).toBeVisible({ timeout: 5000 });

    await toggle.click({ force: true });
    await expect(page.getByText('Save 20%')).not.toBeVisible({ timeout: 5000 });
  });

  /**
   * @desc Verify CTA buttons render on plan cards.
   * @param {{ page: import('playwright').Page }} fixtures
   * @returns {Promise<void>}
   */
  test('CTA buttons are present on plan cards', async ({ page }) => {
    await mockPlansAPI(page);
    await page.goto('/pricing');
    await page.waitForLoadState('domcontentloaded');

    const ctaButtons = page.locator('.billing-pricing-card button:has-text("Get Started")');
    await expect(ctaButtons.first()).toBeVisible({ timeout: 10000 });
    await expect(ctaButtons).toHaveCount(2);
    await expect(page.locator('.billing-pricing-card button:has-text("Current Plan")')).toHaveCount(1);
  });
});

billingDescribe('Pricing Page - Unauthenticated CTA', () => {
  /**
   * @desc Verify that an unauthenticated click on a plan CTA redirects to signin.
   * @param {{ page: import('playwright').Page }} fixtures
   * @returns {Promise<void>}
   */
  test('CTA redirects unauthenticated user to signin', async ({ page }) => {
    await mockPlansAPI(page);
    await page.goto('/pricing');
    await page.waitForLoadState('domcontentloaded');

    const ctaButtons = page.locator('.billing-pricing-card button:has-text("Get Started"):not([disabled])');
    await ctaButtons.first().click();
    await page.waitForURL((url) => url.pathname.includes('/signin'), { timeout: 10000 });

    expect(page.url()).toContain('/signin');
  });
});

billingDescribe('Billing Page - Auth Guard', () => {
  /**
   * @desc Verify that /billing redirects unauthenticated users to signin.
   * @param {{ page: import('playwright').Page }} fixtures
   * @returns {Promise<void>}
   */
  test('redirects unauthenticated user to signin', async ({ page }) => {
    await page.goto('/billing');
    await page.waitForURL((url) => url.pathname.includes('/signin'), { timeout: 10000 });

    expect(page.url()).not.toContain('/billing');
    expect(page.url()).toContain('/signin');
  });
});

billingDescribe('Billing Page - Authenticated', () => {
  test.describe.configure({ mode: 'serial' });

  /**
   * @desc Sign up a test user and create an org via API for authenticated billing tests.
   * @param {{ playwright: import('playwright').Playwright, request: import('playwright').APIRequestContext }} fixtures
   * @returns {Promise<void>}
   */
  test('setup: create test user and active org via API', async ({ playwright, request }) => {
    const res = await signupViaAPI(request, {
      email: testEmail,
      password: testPassword,
      firstName: 'Billing',
      lastName: 'Tester',
    });
    expect(res.user).toBeTruthy();

    const ctx = await authenticatedContext(playwright, testEmail, testPassword);
    const org = await createOrgViaAPI(ctx, `BillingTestOrg${timestamp}`);
    const orgId = org._id || org.id;

    expect(orgId).toBeTruthy();
    await switchOrganizationViaAPI(ctx, orgId);
    await ctx.dispose();
  });

  /**
   * @desc Verify that an authenticated user can access the billing page.
   * @param {{ page: import('playwright').Page }} fixtures
   * @returns {Promise<void>}
   */
  test('authenticated user can access billing page', async ({ page }) => {
    await signin(page, testEmail, testPassword);
    await page.waitForLoadState('networkidle');
    await page.goto('/billing', { waitUntil: 'networkidle', timeout: 15000 });

    await expect(page.getByRole('heading', { name: 'Billing' })).toBeVisible({ timeout: 10000 });
    expect(page.url()).toContain('/billing');
  });
});

billingDescribe('Billing API - Security', () => {
  /**
   * @desc Verify GET /api/billing/plans returns plans (public endpoint).
   * @param {{ request: import('playwright').APIRequestContext }} fixtures
   * @returns {Promise<void>}
   */
  test('GET /api/billing/plans returns plans', async ({ request }) => {
    const res = await request.get(`${API}/billing/plans`);
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
  });

  /**
   * @desc Verify GET /api/billing/subscription without auth returns 401.
   * @param {{ request: import('playwright').APIRequestContext }} fixtures
   * @returns {Promise<void>}
   */
  test('GET /api/billing/subscription without auth returns 401', async ({ request }) => {
    const res = await request.get(`${API}/billing/subscription`, {
      headers: { Cookie: '' },
    });
    expect(res.status()).toBe(401);
  });

  /**
   * @desc Verify POST /api/billing/checkout without auth returns 401.
   * @param {{ request: import('playwright').APIRequestContext }} fixtures
   * @returns {Promise<void>}
   */
  test('POST /api/billing/checkout without auth returns 401', async ({ request }) => {
    const res = await request.post(`${API}/billing/checkout`, {
      headers: { Cookie: '' },
      data: { priceId: 'price_test' },
    });
    expect(res.status()).toBe(401);
  });

  /**
   * @desc Verify POST /api/billing/webhook with invalid signature returns 400.
   * @param {{ request: import('playwright').APIRequestContext }} fixtures
   * @returns {Promise<void>}
   */
  test('POST /api/billing/webhook with invalid signature returns 400', async ({ request }) => {
    const res = await request.post(`${API}/billing/webhook`, {
      headers: { 'stripe-signature': 'invalid_sig' },
      data: '{}',
    });
    expect(res.status()).toBe(400);
  });
});
