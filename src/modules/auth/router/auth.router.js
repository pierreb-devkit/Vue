/**
 * Module dependencies.
 */
import signin from '../views/auth.signin.view.vue';
import signup from '../views/auth.signup.view.vue';
import forgot from '../views/auth.forgot.view.vue';
import reset from '../views/auth.reset.view.vue';
import token from '../views/auth.token.view.vue';

/**
 * Router configuration
 */
export default [
  {
    path: '/signin',
    name: 'Signin',
    component: signin,
    meta: {
      icon: 'fa-solid fa-user',
      display: false, // hide from drawer any time
    },
  },
  {
    path: '/signup',
    name: 'Signup',
    component: signup,
    meta: {
      display: false, // hide from drawer any time
    },
  },
  {
    path: '/forgot',
    name: 'Forgot',
    component: forgot,
    meta: {
      display: false, // hide from drawer any time
    },
  },
  {
    path: '/reset',
    name: 'Reset',
    component: reset,
    meta: {
      display: false, // hide from drawer any time
    },
  },
  {
    path: '/token',
    name: 'Token',
    component: token,
    meta: {
      display: false, // hide from drawer any time
    },
  },
];
