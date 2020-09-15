/**
 * Module dependencies.
 */
import signin from '@/modules/auth/views/auth.signin.view.vue';
import signup from '@/modules/auth/views/auth.signup.view.vue';
import forgot from '@/modules/auth/views/auth.forgot.view.vue';
import reset from '@/modules/auth/views/auth.reset.view.vue';
import token from '@/modules/auth/views/auth.token.view.vue';

/**
 * Router configuration
 */
export default [
  {
    path: '/signin',
    name: 'Signin',
    component: signin,
    meta: {
      icon: 'user',
      display: false, // hide any time
    },
  },
  {
    path: '/signup',
    name: 'Signup',
    component: signup,
    meta: {
      display: false, // hide any time
    },
  },
  {
    path: '/forgot',
    name: 'Forgot',
    component: forgot,
    meta: {
      display: false, // hide any time
    },
  },
  {
    path: '/reset',
    name: 'Reset',
    component: reset,
    meta: {
      display: false, // hide any time
    },
  },
  {
    path: '/token',
    name: 'Token',
    component: token,
    meta: {
      display: false, // hide any time
    },
  },
];
