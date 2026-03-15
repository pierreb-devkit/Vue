/**
 * Module dependencies.
 */
import signin from '../views/signin.view.vue';
import signup from '../views/signup.view.vue';
import forgot from '../views/forgot.view.vue';
import reset from '../views/reset.view.vue';
import token from '../views/token.view.vue';
import verifyEmail from '../views/verifyEmail.view.vue';

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
    path: '/verify-email/:token?',
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
