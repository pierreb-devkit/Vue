export default {
  sign: {
    route: '/tasks', // redirect route after sign-in/up (e.g. '/tasks', '/dashboard')
    in: true, // true to display "Sign In" link in header
    up: true, // true to display "Sign Up" link on sign-in page
  },
  oAuth: { // third-party OAuth — each requires matching server-side config
    google: true, // true to enable "Sign in with Google"
    apple: true, // true to enable "Sign in with Apple"
  },
};
