<template>
  <v-container
    fluid
    class="pa-0 fill-height"
  >
    <ApiReference :configuration="scalarConfig" />
  </v-container>
</template>

<script setup>
import { computed } from 'vue';
import { ApiReference } from '@scalar/api-reference';
import '@scalar/api-reference/style.css';
import config from '../../../lib/services/config';

const specUrl = computed(
  () => `${config.api.protocol}://${config.api.host}:${config.api.port}/${config.api.base}/spec.json`,
);

const scalarConfig = computed(() => ({
  url: specUrl.value,
  theme: 'default',
  hideDownloadButton: false,
}));
</script>
