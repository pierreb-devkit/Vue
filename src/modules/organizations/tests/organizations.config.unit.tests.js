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

  it('organizations.tabs includes exactly one entry (the billing descriptor)', () => {
    expect(organizationsDefaultConfig.organizations.tabs).toHaveLength(1);
  });

  it('billing tab descriptor has all required fields (value, label, icon, route)', () => {
    const billingTab = organizationsDefaultConfig.organizations.tabs[0];
    expect(billingTab).toMatchObject({
      value: 'billing',
      label: 'Billing',
      icon: 'fa-solid fa-credit-card',
      route: 'billing',
    });
  });

  it('billing tab descriptor carries the CASL pair (action + subject) for resolveSurfaceTabs', () => {
    const billingTab = organizationsDefaultConfig.organizations.tabs[0];
    expect(billingTab.action).toBe('manage');
    expect(billingTab.subject).toBe('Organization');
  });

  it('billing descriptor passes isValidTab validation', () => {
    const billingTab = organizationsDefaultConfig.organizations.tabs[0];
    expect(isValidTab(billingTab)).toBe(true);
  });

  it('resolveSurfaceTabs returns billing tab when can("manage","Organization") is true', () => {
    const tabs = organizationsDefaultConfig.organizations.tabs;
    const result = resolveSurfaceTabs(tabs, () => true);
    expect(result).toHaveLength(1);
    expect(result[0].value).toBe('billing');
  });

  it('resolveSurfaceTabs filters out billing tab when can("manage","Organization") is false', () => {
    const tabs = organizationsDefaultConfig.organizations.tabs;
    const result = resolveSurfaceTabs(tabs, () => false);
    expect(result).toHaveLength(0);
  });
});
