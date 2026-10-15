export default {
  sign: {
    route: '/tasks', // redirect route after sign-in/up (e.g. '/tasks', '/dashboard')
    in: true, // true to display "Sign In" link in header
    up: true, // true to display "Sign Up" link on sign-in page
    upNotice: '', // optional plain-text notice under the sign-up form (e.g. legal basis for onboarding emails)
    accentImage: '', // optional image (path or URL) shown centered above the sign-in/sign-up title; decorative
  },
};
