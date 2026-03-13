/**
 * Module dependencies.
 */
import signin from '../local/views/signin.view.vue';
import signup from '../local/views/signup.view.vue';
import forgot from '../local/views/forgot.view.vue';
import reset from '../local/views/reset.view.vue';
import token from '../local/views/token.view.vue';
import verifyEmail from '../local/views/verifyEmail.view.vue';

/**
 * Router configuration.
 */
export default [
  {
    path: '/signin',
    name: 'Signin',
    component: signin,
    meta: {
      icon: 'fa-solid fa-user',
      display: false,
    },
  },
  {
    path: '/signup',
    name: 'Signup',
    component: signup,
    meta: {
      display: false,
    },
  },
  {
    path: '/forgot',
    name: 'Forgot',
    component: forgot,
    meta: {
      display: false,
    },
  },
  {
    path: '/reset',
    name: 'Reset',
    component: reset,
    meta: {
      display: false,
    },
  },
  {
    path: '/token',
    name: 'Token',
    component: token,
    meta: {
      display: false,
    },
  },
  {
    path: '/verify-email/:token',
    name: 'VerifyEmail',
    component: verifyEmail,
    meta: {
      display: false,
    },
  },
];

/**
 * Exports.
 */
