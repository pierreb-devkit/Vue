import { test, expect } from '@playwright/test';
import { signin, signupViaAPI } from '../../../lib/helpers/e2e/auth.js';
import { authenticatedContext, createOrgViaAPI } from '../../../lib/helpers/e2e/api.js';

const timestamp = Date.now();
const ownerEmail = `e2e-djowner-${timestamp}@domain${timestamp}.com`;
const memberEmail = `e2e-djmember-${timestamp}@domain${timestamp}.com`;
const password = 'E2eTestPass99xyz';

let orgId;

test.describe('Organization Domain Join E2E', () => {
  test.describe.configure({ mode: 'serial' });

  // ── Phase 1: Signup & pending join ────────────────────────────────

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
    const org = await createOrgViaAPI(ctx, `DomainOrg${timestamp}`);
    expect(org).toBeTruthy();
    orgId = org._id || org.id;
    expect(orgId).toBeTruthy();
    await ctx.dispose();
  });

  test('member signs up via UI — sees pending message, no sidenav', async ({ page }) => {
    await page.goto('/signup');
    await page.getByPlaceholder('name@example.com').first().waitFor({ state: 'visible', timeout: 10000 });

    await page.getByPlaceholder('name@example.com').first().fill(memberEmail);
    await page.getByPlaceholder('Create a password').first().fill(password);
    await page.getByRole('button', { name: /continue/i }).click();

    // Wait for the pending join message
    const pendingText = page.locator('text=request to join');
    await expect(pendingText).toBeVisible({ timeout: 10000 });

    // CRITICAL: Sidenav must NOT be visible during signup
    const sidenav = page.locator('nav.v-navigation-drawer, .v-navigation-drawer');
    await expect(sidenav).toHaveCount(0, { timeout: 3000 });
  });

  test('member signs in — lands on organization-required', async ({ page }) => {
    await signin(page, memberEmail, password);
    await page.waitForTimeout(2000);

    // Should land on organization-required page (pending member has no active org)
    expect(page.url()).toContain('/organization-required');

    // Should see the pending request banner
    await expect(page.getByRole('alert').getByText('pending approval')).toBeVisible({ timeout: 10000 });
  });

  test('member refresh on signup — redirects to organization-required', async ({ page }) => {
    await signin(page, memberEmail, password);
    await page.waitForTimeout(1000);

    // Navigate to signup (simulating refresh — user is already logged in)
    await page.goto('/signup');
    await page.waitForTimeout(2000);

    // Should redirect to organization-required (not show signup form again)
    expect(page.url()).toContain('/organization-required');
  });

  // ── Phase 2: Owner approves, then member access control ───────────

  test('owner approves member join request', async ({ page }) => {
    await signin(page, ownerEmail, password);
    await page.goto(`/users/organizations/${orgId}`);
    await page.waitForTimeout(2000);

    // Should see pending join request
    const approveButton = page.getByRole('button', { name: /approve/i });
    await expect(approveButton).toBeVisible({ timeout: 10000 });
    await approveButton.click();
    await page.waitForTimeout(1000);
  });

  test('approved member — no Manage button on account page', async ({ page }) => {
    await signin(page, memberEmail, password);
    await page.goto('/users');
    await page.waitForTimeout(2000);

    // Click the Organizations tab
    const orgTab = page.getByRole('tab', { name: /organizations/i });
    await orgTab.click({ timeout: 10000 });
    await page.waitForTimeout(2000);

    // Members should NOT see the chevron (manage) icon on their org item
    const chevron = page.locator('.v-list-item .fa-chevron-right');
    await expect(chevron).toHaveCount(0, { timeout: 5000 });
  });

  test('approved member — no management controls on org page', async ({ page }) => {
    await signin(page, memberEmail, password);
    await page.goto(`/users/organizations/${orgId}`);
    await page.waitForTimeout(1500);

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

  test('owner sees full management controls', async ({ page }) => {
    await signin(page, ownerEmail, password);
    await page.goto(`/users/organizations/${orgId}`);
    await page.waitForTimeout(1500);

    // Delete button IS visible
    const deleteButton = page.locator('button', { hasText: 'Delete' });
    await expect(deleteButton).toBeVisible({ timeout: 10000 });

    // Invite Member IS visible
    const inviteSection = page.locator('text=Invite Member');
    await expect(inviteSection).toBeVisible({ timeout: 10000 });
  });
});
