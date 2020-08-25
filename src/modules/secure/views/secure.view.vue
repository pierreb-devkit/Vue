<template>
  <v-container fluid>
    <v-row class="mx-3">
      <v-col cols="12">
        <v-row align="start" justify="center">
          <v-card
            class="pa-8"
            outlined
            tile
            width="100%"
            :style="{ background: config.vuetify.theme.themes[theme].surface }"
            :flat="config.vuetify.theme.flat"
          >
            <h2 class="text-center">This page is protected by auth</h2>
          </v-card>
        </v-row>
      </v-col>
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
