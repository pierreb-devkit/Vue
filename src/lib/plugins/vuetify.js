/**
 * Module dependencies.
 */
/* eslint-disable import/extensions */
import 'vuetify/styles';
import '@fortawesome/fontawesome-free/css/all.css';
import '@mdi/font/css/materialdesignicons.css';

// Vuetify
import { createVuetify } from 'vuetify';
import { aliases, fa } from 'vuetify/lib/iconsets/fa';
import { mdi } from 'vuetify/lib/iconsets/mdi';
import config from '../../config/index.cjs';

// Toto: switch theme to TS
// const myCustomLightTheme: ThemeDefinition = {
//   dark: false,
//   colors: {
//     background: '#FFFFFF',
//     surface: '#FFFFFF',
//     primary: '#6200EE',
//     'primary-darken-1': '#3700B3',
//     secondary: '#03DAC6',
//     'secondary-darken-1': '#018786',
//     error: '#B00020',
//     info: '#2196F3',
//     success: '#4CAF50',
//     warning: '#FB8C00',
//   },
// };

export default createVuetify({
  theme: config.vuetify.theme,
  icons: {
    defaultSet: config.vuetify.icons.defaultSet,
    aliases,
    sets: {
      fa,
      mdi,
    },
  },
});
