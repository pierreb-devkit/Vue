<template>
  <v-container fluid>
    <v-row class="ma-2" align="start" justify="center">
      <v-card class="pa-6" width="100%" :style="{ background: config.vuetify.theme.themes[theme].colors.surface }" :flat="config.vuetify.theme.flat">
        <h2 class="text-center">This page is protected by auth</h2>
      </v-card>
    </v-row>
  </v-container>
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
  computed: {
    ...mapGetters(['theme']),
  },
};
</script>
