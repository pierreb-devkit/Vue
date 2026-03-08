export default {
  sign: {
    route: '/tasks', // route push after sign in/up
    in: true, // display signin link
    up: true, // display signup link
  },
  oAuth: {
    google: true, // require server side oAuth config
    apple: true, // require server side oAuth config
  },
};
