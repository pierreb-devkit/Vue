/**
 * Module dependencies.
 */
import 'vuetify/styles';
import '@fortawesome/fontawesome-free/css/all.css';
import { createVuetify } from 'vuetify';
import { aliases, fa } from 'vuetify/lib/iconsets/fa';
import config from '../../config/index.js';
import { isDark } from '../helpers/theme.js';

/**
 * Vuetify configuration.
 * `defaultTheme` seeds the initial paint from the resolved config/OS
 * preference so there is no light-theme flash before `app.vue`'s
 * `coreStore.theme` watch fires (#4462). `coreStore.theme` stays the single
 * source of truth once the app mounts — this only covers the pre-mount paint.
 */
export default createVuetify({
  theme: {
    ...config.vuetify.theme,
    defaultTheme: isDark(config.vuetify.theme.dark) ? 'dark' : 'light',
  },
  icons: {
    defaultSet: config.vuetify.icons.defaultSet,
    aliases,
    sets: {
      fa,
    },
  },
});
