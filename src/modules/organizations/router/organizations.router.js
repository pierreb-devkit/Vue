/**
 * Module dependencies.
 */
import organizations from '../views/organizations.view.vue';
import organization from '../views/organization.view.vue';
import organizationsCreate from '../views/organizations.create.view.vue';

/**
 * Router configuration.
 */
export default [
  {
    path: '/organizations',
    name: 'Organizations',
    component: organizations,
    meta: {
      icon: 'fa-solid fa-building',
      action: 'read', subject: 'Organization',
    },
  },
  {
    path: '/organizations/create',
    name: 'organization create',
    component: organizationsCreate,
    meta: {
      display: false,
      action: 'create', subject: 'Organization',
    },
  },
  {
    path: '/organizations/:organizationId',
    name: 'organization',
    component: organization,
    meta: {
      display: false,
      action: 'read', subject: 'Organization',
    },
  },
];

/**
 * Exports.
 */
