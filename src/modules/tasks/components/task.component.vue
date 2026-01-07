<template>
  <v-col cols="12" sm="12" md="6" lg="4" xl="3">
    <v-card class="mx-auto" :style="{ background: config.vuetify.theme.themes[theme].colors.surface }" :flat="config.vuetify.theme.flat">
      <v-card-title>{{ item.title }}</v-card-title>
      <v-card-text>{{ item.description }}</v-card-text>
      <v-card-actions v-if="isLoggedIn">
        <div class="flex-grow-1"></div>
        <v-btn v-if="item.id" color="secondary" :to="`/tasks/${item.id}`" icon>
          <v-icon icon="fa-solid fa-eye"></v-icon>
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-col>
</template>

<script>
/**
 * Module dependencies.
 */
import { useCoreStore } from '../../core/stores/core.store';
import { useAuthStore } from '../../auth/stores/auth.store';
/**
 * Component definition.
 */
export default {
  name: 'TaskComponent',
  props: {
    item: {
      type: Object,
      required: true,
    },
  },
  computed: {
    isLoggedIn() {
      const authStore = useAuthStore();
      return authStore.isLoggedIn;
    },
    theme() {
      const coreStore = useCoreStore();
      return coreStore.theme;
    },
  },
};
</script>
