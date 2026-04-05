<template>
  <v-container
    fluid
    class="pa-0 fill-height"
  >
    <ApiReference v-if="specUrl" :configuration="scalarConfig" />
  </v-container>
</template>

<script setup>
import { computed } from 'vue';
import { ApiReference } from '@scalar/api-reference';
import '@scalar/api-reference/style.css';
import config from '../../../lib/services/config';

const specUrl = computed(() => {
  const host = String(config.api.host || '').replace(/[^a-z0-9.-]/gi, '');
  const port = String(config.api.port || '').replace(/[^0-9]/g, '');
  if (!host || !port) return null;
  return `${config.api.protocol}://${host}:${port}/${config.api.base}/spec.json`;
});

const scalarConfig = computed(() => ({
  url: specUrl.value,
  theme: 'default',
  hideDownloadButton: false,
}));
</script>
