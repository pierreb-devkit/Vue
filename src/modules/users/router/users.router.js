/**
 * Module dependencies.
 */
import users from '../views/users.view.vue';
import user from '../views/user.view.vue';

/**
 * Router configuration
 */
export default [
  {
    path: '/users',
    name: 'Users',
    component: users,
    meta: {
      icon: 'fa-solid fa-user-tie',
      color: {
        border: '#000', // color icon // todo: get from config config.vuetify.theme.themes[store.state.theme].error
      },
      roles: ['admin'], // proteced, require one of this roles
    },
  },
  {
    path: '/users/:id',
    name: 'user',
    component: user,
    meta: {
      display: false, // hide from drawer any time
      roles: ['admin'], // proteced, require one of this roles
    },
  },
];
