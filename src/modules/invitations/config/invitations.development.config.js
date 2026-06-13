export default {
  // Surface tabs contributed by the standalone invitations module. These are
  // merged at runtime by the host surfaces (admin.layout.vue → config.admin.tabs,
  // user.view.vue → config.users.extraTabs) and validated + CASL-filtered inside
  // CoreSurfaceTabBar. Both routes are relative (resolve under their parent).
  //
  // NOTE: the account tab uses `users.extraTabs` (NOT `users.tabs`) on purpose —
  // generateConfig's deepMerge REPLACES arrays, and `invitations` sorts before
  // `users` alphabetically, so contributing `users.tabs` here would clobber the
  // base Profile/Organizations tabs. `extraTabs` is a fresh key owned by nobody,
  // so it merges cleanly into the `users` config object.
  //
  // The `module` field marks each tab as owned by this optional module so
  // CoreSurfaceTabBar (via resolveSurfaceTabs + isModuleActive) hides it when
  // `modules.invitations.activated` is false — mirroring the route-injection
  // gate, which already skips deactivated modules.
  admin: {
    tabs: [
      { value: 'invitations', label: 'Invitations', icon: 'fa-solid fa-envelope', route: 'invitations', action: 'manage', subject: 'UserAdmin', module: 'invitations' },
    ],
  },
  users: {
    extraTabs: [
      { value: 'invitations', label: 'Referrals', icon: 'fa-solid fa-gift', route: 'invitations', action: 'create', subject: 'Invitation', module: 'invitations' },
    ],
  },
  modules: {
    invitations: {
      activated: true,
    },
  },
};
