/**
 * Module dependencies.
 */
import adminLayout from '../views/admin.layout.vue';
import adminUsers from '../views/admin.users.view.vue';
import adminOrganizations from '../views/admin.organizations.view.vue';
import adminReadiness from '../views/admin.readiness.view.vue';
import adminActivity from '../views/admin.activity.view.vue';
import adminUser from '../views/admin.user.view.vue';
import organizationLayout from '../../organizations/components/organization.detail.component.vue';
import organizationGeneralTab from '../../organizations/components/organization.general.tab.vue';

/**
 * Router configuration.
 *
 * The admin module exports a **parent route** (`/admin`) whose component
 * is the admin layout (page header + tab bar + `<router-view>`). Each
 * built-in section (Users, Organizations, Readiness, Activity) is a
 * routed child so that the tab bar and the downstream-contributed extras
 * (`config.admin.tabs`) live in one flat navigation row.
 *
 * Detail views (`users/:id`, `organizations/:organizationId`) are also
 * children of the same parent — they deep-link inside the layout.
 *
 * Downstream modules that contribute an "admin tab" must register their
 * routes via the `injectAdminChildren` helper in `@/lib/helpers/router`
 * with **relative** paths (e.g. `'knowledge'`, not `'/admin/knowledge'`).
 *
 * C3 note: Admin Organization reuses the shared `organizationLayout` +
 * `organizationGeneralTab` components. The layout receives `backRoute="/admin"`
 * via route props so the delete action redirects back to the admin section.
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
        redirect: { name: 'Admin Users' },
      },
      {
        path: 'users',
        name: 'Admin Users',
        component: adminUsers,
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
        path: 'organizations',
        name: 'Admin Organizations',
        component: adminOrganizations,
        meta: {
          action: 'manage', subject: 'UserAdmin',
        },
      },
      {
        path: 'organizations/:organizationId',
        name: 'Admin Organization',
        component: organizationLayout,
        props: { backRoute: '/admin' },
        meta: {
          display: false,
          action: 'manage', subject: 'UserAdmin',
        },
        // Default child: reuses the shared general-tab so admin org detail
        // renders the same sections (Details, Roles, Members, Invite, Pending).
        children: [
          {
            path: '',
            name: 'Admin Organization General',
            component: organizationGeneralTab,
            props: (route) => ({
              organizationId: route.params.organizationId,
            }),
            meta: {
              display: false,
              action: 'manage', subject: 'UserAdmin',
            },
          },
        ],
      },
      {
        path: 'readiness',
        name: 'Admin Readiness',
        component: adminReadiness,
        meta: {
          action: 'manage', subject: 'UserAdmin',
        },
      },
      {
        path: 'activity',
        name: 'Admin Activity',
        component: adminActivity,
        meta: {
          action: 'manage', subject: 'UserAdmin',
        },
      },
    ],
  },
];

/**
 * Exports.
 */
