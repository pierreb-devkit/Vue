<template>
  <v-col cols="12" sm="12" md="6" lg="4" xl="3">
    <v-card
      class="mx-auto"
      :style="{ background: config.vuetify.theme.themes[theme].surface }"
      :flat="config.vuetify.theme.flat"
    >
      <v-card-title>{{ item.title }}</v-card-title>
      <v-card-text>{{ item.description }}</v-card-text>
      <v-card-actions v-if="isLoggedIn">
        <div class="flex-grow-1"></div>
        <v-btn v-if="item.id" :to="`/tasks/${item.id}`" icon>
          <v-icon>fa-eye</v-icon>
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-col>
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
  name: 'taskComponent',
  props: ['item'],
  computed: {
    ...mapGetters(['isLoggedIn', 'theme']),
  },
};
</script>
