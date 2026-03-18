/**
 * Module dependencies.
 */
import organizationRequired from '../views/organizations.required.view.vue';
import organizationCreate from '../views/organization.create.view.vue';
import organization from '../views/organization.view.vue';
import invite from '../views/invite.view.vue';

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
    path: '/users/organizations/:organizationId',
    name: 'Account Organization',
    component: organization,
    meta: {
      display: false,
      action: 'read',
      subject: 'Organization',
    },
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
