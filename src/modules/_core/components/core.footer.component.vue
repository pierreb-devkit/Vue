<template>
  <v-footer
    :style="{
      background: this.config.vuetify.theme.themes[theme].primary,
      color: config.vuetify.theme.themes[theme].onPrimary,
    }"
    app
  >
    <div class="flex-grow-1"></div>
    <div>
      &copy; 2019
      <a href="https://weareopensource.me" style="color: white; text-decoration: none">We Are Open Source</a>
    </div>
  </v-footer>
</template>

<script>
/**
 * Module dependencies.
 */
import { mapGetters } from 'vuex';
/**
 * Export default
 */
export default {
  name: 'waosFooter',
  computed: {
    ...mapGetters(['theme']),
  },
};
</script>
