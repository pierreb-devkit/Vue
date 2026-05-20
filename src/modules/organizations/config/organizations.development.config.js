export default {
  organizations: {
    roles: ['member', 'admin'], // assignable org roles (owner excluded — set at creation only)
    // tabs — extra tabs rendered in the org-settings surface (SurfaceTabBar).
    // Each entry: { value, label, icon?, route, action?, subject? }
    // action + subject are the CASL pair filtered by resolveSurfaceTabs.
    tabs: [
      { value: 'organization', label: 'Organization', icon: 'fa-solid fa-building', route: 'general', action: 'read', subject: 'Organization' },
      { value: 'billing', label: 'Billing', icon: 'fa-solid fa-credit-card', route: 'billing', action: 'manage', subject: 'Organization' },
    ],
  },
};
