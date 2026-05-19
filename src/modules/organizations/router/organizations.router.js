/**
 * Module dependencies.
 */
import organizationRequired from '../views/organizations.required.view.vue';
import organizationCreate from '../views/organization.create.view.vue';
import organization from '../views/organization.view.vue';
import invite from '../views/invite.view.vue';

/**
 * Parent route path for the organization detail page.
 * Used as the injection point for downstream child modules (e.g. billing
 * settings tab) via `injectModuleChildren`. Exported as a constant so
 * app.router.js and tests share a single source of truth — no silent drift.
 */
export const ORG_PARENT_PATH = '/users/organizations/:organizationId';

/**
 * Router configuration.
 */
export default [
  {
    path: '/organization-required',
    name: 'Organization Required',
    component: organizationRequired,
    meta: {
      display: false,
      requiresAuth: true,
    },
  },
  {
    path: '/users/organizations/create',
    name: 'Account Organization Create',
    component: organizationCreate,
    meta: {
      display: false,
      action: 'create',
      subject: 'Organization',
    },
  },
  {
    path: ORG_PARENT_PATH,
    name: 'Account Organization',
    component: organization,
    meta: {
      display: false,
      action: 'read',
      subject: 'Organization',
    },
    // Injection point for downstream modules (e.g. billing settings tab).
    // PR (c) / downstream projects populate this via organizationChildModules.
    children: [],
  },
  {
    path: '/invite',
    name: 'Invite',
    component: invite,
    meta: {
      display: false,
    },
  },
];

/**
 * Exports.
 */
