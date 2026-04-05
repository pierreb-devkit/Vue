<template>
  <div class="fill-height">
    <v-container
      fluid
      class="pa-0"
    >
      <v-tabs
        :model-value="activeTab"
        color="primary"
        class="px-4"
      >
        <v-tab
          value="api"
          :to="{ name: 'Docs' }"
          class="text-none"
        >
          API Reference
        </v-tab>
        <v-tab
          value="guides"
          :to="{ name: 'DocsGuides' }"
          class="text-none"
        >
          Guides
        </v-tab>
      </v-tabs>
      <v-divider />
    </v-container>

    <router-view />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const activeTab = computed(() => (route.path.startsWith('/docs/guides') ? 'guides' : 'api'));
</script>
