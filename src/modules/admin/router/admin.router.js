/**
 * Module dependencies.
 */
import admin from '../views/admin.view.vue';
import adminUser from '../views/admin.user.view.vue';
import adminOrganization from '../views/admin.organization.view.vue';

/**
 * Router configuration.
 */
export default [
  {
    path: '/admin',
    name: 'Admin',
    component: admin,
    meta: {
      icon: 'fa-solid fa-user-tie',
      position: 'bottom',
      action: 'manage', subject: 'UserAdmin',
    },
  },
  {
    path: '/admin/users/:id',
    name: 'Admin User',
    component: adminUser,
    meta: {
      display: false,
      action: 'manage', subject: 'UserAdmin',
    },
  },
  {
    path: '/admin/organizations/:organizationId',
    name: 'Admin Organization',
    component: adminOrganization,
    meta: {
      display: false,
      action: 'manage', subject: 'UserAdmin',
    },
  },
];

/**
 * Exports.
 */
