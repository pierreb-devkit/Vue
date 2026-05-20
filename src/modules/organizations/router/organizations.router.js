/**
 * Module dependencies.
 */
import organizationRequired from '../views/organizations.required.view.vue';
import organizationCreate from '../views/organization.create.view.vue';
import organizationLayout from '../components/organization.detail.component.vue';
import organizationGeneralTab from '../components/organization.general.tab.vue';
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
    component: organizationLayout,
    meta: {
      display: false,
      action: 'read',
      subject: 'Organization',
    },
    // Default child: native org-settings sections (Details, Roles, Members,
    // Invite, Pending Requests). Downstream child modules (e.g. billing)
    // are injected via organizationChildModules in app.router.js.
    children: [
      {
        // Redirect bare /users/organizations/:id → :id/general so SurfaceTabBar
        // descriptors with `route: 'general'` resolve correctly.
        path: '',
        redirect: { name: 'Account Organization General' },
      },
      {
        path: 'general',
        name: 'Account Organization General',
        component: organizationGeneralTab,
        props: (route) => ({ organizationId: route.params.organizationId }),
        meta: {
          display: false,
          action: 'read',
          subject: 'Organization',
        },
      },
    ],
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
