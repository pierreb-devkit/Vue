/**
 * Module dependencies.
 */
import 'vuetify/styles';
import '@fortawesome/fontawesome-free/css/all.css';
import { createVuetify } from 'vuetify';
import { aliases, fa } from 'vuetify/lib/iconsets/fa';
import config from '../../config/index.js';
import { isDark, roundedProp } from '../helpers/theme.js';

/**
 * Vuetify configuration.
 * `defaultTheme` seeds the initial paint from the resolved config/OS
 * preference so there is no light-theme flash before `app.vue`'s
 * `coreStore.theme` watch fires (#4462). `coreStore.theme` stays the single
 * source of truth once the app mounts — this only covers the pre-mount paint.
 * `defaults.VCard` applies the configured flat look and radius to every card,
 * so a card needs no hand-wired `flat` / `rounded` binding.
 */
export default createVuetify({
  theme: {
    ...config.vuetify.theme,
    defaultTheme: isDark(config.vuetify.theme.dark) ? 'dark' : 'light',
  },
  defaults: {
    VCard: {
      flat: !!config.vuetify.theme.flat,
      rounded: roundedProp(config.vuetify.theme.rounded),
    },
  },
  icons: {
    defaultSet: config.vuetify.icons.defaultSet,
    aliases,
    sets: {
      fa,
    },
  },
});
