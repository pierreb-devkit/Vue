/**
 * Router configuration — standalone `invitations` module.
 *
 * This module owns NO top-level route. Instead it exports two relative-path
 * child-route arrays that the host (`app.router.js`) injects under existing
 * parents via `injectModuleChildren`, gated by `isModuleActive('invitations')`:
 *
 *  - `invitationsAdminRoutes`   → injected under `/admin`  (admin management tab)
 *  - `invitationsAccountRoutes` → injected under `/users`  (account "Referrals" tab)
 *
 * Paths are **relative** (`'invitations'`, not `'/admin/invitations'`) so they
 * resolve under their respective parents — required by `isValidChildRoute`.
 * Views are lazy-imported (mirrors the billing module's self-injection pattern)
 * so they only load when the module is active. The matching tab descriptors live
 * in `config/invitations.development.config.js` (`admin.tabs` + `users.extraTabs`).
 *
 * @module invitations/router
 */

/**
 * Admin-surface child route (rendered inside the admin layout). CASL-gated to
 * platform admins via `meta.action/subject`.
 * @type {Array<object>}
 */
export const invitationsAdminRoutes = [
  {
    path: 'invitations',
    name: 'Admin Invitations',
    component: () => import('../views/invitations.admin.view.vue'),
    meta: {
      action: 'manage', subject: 'UserAdmin',
    },
  },
];

/**
 * Account-surface child route (rendered inside the account layout). Requires an
 * authenticated user; fine-grained tab visibility is handled by the
 * `users.extraTabs` CASL descriptor (`create` / `Invitation`).
 * @type {Array<object>}
 */
export const invitationsAccountRoutes = [
  {
    path: 'invitations',
    name: 'Account Invitations',
    component: () => import('../views/invitations.account.view.vue'),
    meta: {
      requiresAuth: true,
    },
  },
];

/**
 * Exports.
 */
export default { invitationsAdminRoutes, invitationsAccountRoutes };
