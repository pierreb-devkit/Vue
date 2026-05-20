import { describe, it, expect } from 'vitest';
import organizationsDefaultConfig from '../config/organizations.development.config.js';
import { isValidTab, resolveSurfaceTabs } from '../../../lib/helpers/surface-tabs.js';

/**
 * Unit tests for the organizations module config defaults.
 *
 * Part A of C2: asserts that config.organizations.tabs includes the billing
 * descriptor so the billing tab appears under org settings for users with
 * can('manage', 'Organization').
 */
describe('organizations module config — organizations.tabs', () => {
  it('organizations.tabs is defined as an array in the module config', () => {
    expect(Array.isArray(organizationsDefaultConfig.organizations.tabs)).toBe(true);
  });

  it('organizations.tabs includes the billing descriptor', () => {
    const tabs = organizationsDefaultConfig.organizations.tabs;
    expect(Array.isArray(tabs)).toBe(true);
    expect(tabs.length).toBeGreaterThanOrEqual(1);
    expect(tabs.find((t) => t.value === 'billing')).toMatchObject({
      value: 'billing',
      label: 'Billing',
      icon: 'fa-solid fa-credit-card',
      route: 'billing',
      action: 'manage',
      subject: 'Organization',
    });
  });

  it('billing tab descriptor has all required fields (value, label, icon, route)', () => {
    const billingTab = organizationsDefaultConfig.organizations.tabs.find((t) => t.value === 'billing');
    expect(billingTab).toMatchObject({
      value: 'billing',
      label: 'Billing',
      icon: 'fa-solid fa-credit-card',
      route: 'billing',
    });
  });

  it('billing tab descriptor carries the CASL pair (action + subject) for resolveSurfaceTabs', () => {
    const billingTab = organizationsDefaultConfig.organizations.tabs.find((t) => t.value === 'billing');
    expect(billingTab.action).toBe('manage');
    expect(billingTab.subject).toBe('Organization');
  });

  it('billing descriptor passes isValidTab validation', () => {
    const billingTab = organizationsDefaultConfig.organizations.tabs.find((t) => t.value === 'billing');
    expect(isValidTab(billingTab)).toBe(true);
  });

  it('resolveSurfaceTabs returns billing tab when can("manage","Organization") is true', () => {
    const tabs = organizationsDefaultConfig.organizations.tabs;
    const result = resolveSurfaceTabs(tabs, () => true);
    // Both organization (read) and billing (manage) are visible when can() always returns true
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result.find((t) => t.value === 'billing')).toBeDefined();
  });

  it('resolveSurfaceTabs filters out billing tab when can("manage","Organization") is false', () => {
    const tabs = organizationsDefaultConfig.organizations.tabs;
    // can() = false filters out all CASL-gated tabs; organization tab has action:'read' so also filtered
    const result = resolveSurfaceTabs(tabs, () => false);
    expect(result).toHaveLength(0);
  });

  test('organizations.tabs has the "organization" tab as the first entry', () => {
    expect(organizationsDefaultConfig.organizations.tabs[0]).toEqual({
      value: 'organization',
      label: 'Organization',
      icon: 'fa-solid fa-building',
      route: 'general',
      action: 'read',
      subject: 'Organization',
    });
  });

  test('organizations.tabs still has the "billing" tab (preserved)', () => {
    const billing = organizationsDefaultConfig.organizations.tabs.find((t) => t.value === 'billing');
    expect(billing).toBeTruthy();
    expect(billing.route).toBe('billing');
  });
});
