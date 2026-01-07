/**
 * Module dependencies.
 */
import 'vuetify/styles';
import '@fortawesome/fontawesome-free/css/all.css';
import { createVuetify } from 'vuetify';
import { aliases, fa } from 'vuetify/lib/iconsets/fa';
import config from '../../config/index.js';

/**
 * Vuetify configuration.
 */
export default createVuetify({
  theme: config.vuetify.theme,
  icons: {
    defaultSet: config.vuetify.icons.defaultSet,
    aliases,
    sets: {
      fa,
    },
  },
});
