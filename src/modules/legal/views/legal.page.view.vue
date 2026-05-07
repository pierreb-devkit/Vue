<template>
  <v-container class="legal-container py-12">
    <v-row justify="center">
      <v-col cols="12" md="10" lg="9">
        <template v-if="page.notFound">
          <v-alert type="warning" variant="tonal">
            {{ $t('legal.pages.notFound') }}
          </v-alert>
        </template>
        <template v-else>
          <h1 class="mb-6">{{ page.title }}</h1>
          <!-- eslint-disable-next-line vue/no-v-html -- Static markdown bundled at build time, no user input -->
          <article class="legal-prose" v-html="page.html" />
        </template>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useLegalPage } from '../composables/useLegalPage';
import config from '@/config';

const route = useRoute();
const page = ref({ title: '', html: '', notFound: false });

/**
 * Loads legal page content by slug.
 * On network or parse failure, falls back to a not-found state so the view
 * degrades gracefully without an unhandled rejection.
 * @param {string} slug - The legal page slug (e.g. 'terms', 'privacy')
 * @returns {Promise<void>}
 */
const load = async (slug) => {
  try {
    page.value = await useLegalPage(slug, { config });
  } catch (err) {
    console.warn('[legal] page load failed', err);
    page.value = { title: '', html: '', notFound: true };
  }
};

watch(() => route.params.slug, (s) => load(s), { immediate: true });
</script>
