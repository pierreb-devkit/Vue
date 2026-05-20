export default {
  whitelists: {
    users: {
      roles: ['user', 'admin'],
    },
  },
  users: {
    tabs: [
      { value: 'profile', label: 'Profile', icon: 'fa-solid fa-id-card', route: 'profile' },
      { value: 'organizations', label: 'Organizations', icon: 'fa-solid fa-building', route: 'organizations' },
    ],
  },
};
