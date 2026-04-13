/**
 * Module dependencies.
 */
import adminLayout from '../views/admin.layout.vue';
import adminContent from '../views/admin.content.vue';
import adminUser from '../views/admin.user.view.vue';
import adminOrganization from '../views/admin.organization.view.vue';

/**
 * Router configuration.
 *
 * The admin module exports a **parent route** (`/admin`) whose component
 * is the admin layout (page header + tab bar + `<router-view>`). Built-in
 * views (general content, user/organization detail) and any downstream
 * injected child routes are rendered inside that `<router-view>`.
 *
 * Downstream modules should **not** add sibling routes like
 * `/admin/knowledge` anymore. Instead, register them via the
 * `injectAdminChildren` helper in `@/lib/helpers/router` so they become
 * children of this parent route.
 */
export default [
  {
    path: '/admin',
    name: 'Admin',
    component: adminLayout,
    meta: {
      icon: 'fa-solid fa-user-tie',
      order: 20, // sidenav sort order within bottom section (lower = first)
      position: 'bottom',
      action: 'manage', subject: 'UserAdmin',
    },
    children: [
      {
        path: '',
        name: 'Admin General',
        component: adminContent,
        meta: {
          action: 'manage', subject: 'UserAdmin',
        },
      },
      {
        path: 'users/:id',
        name: 'Admin User',
        component: adminUser,
        meta: {
          display: false,
          action: 'manage', subject: 'UserAdmin',
        },
      },
      {
        path: 'organizations/:organizationId',
        name: 'Admin Organization',
        component: adminOrganization,
        meta: {
          display: false,
          action: 'manage', subject: 'UserAdmin',
        },
      },
    ],
  },
];

/**
 * Exports.
 */
