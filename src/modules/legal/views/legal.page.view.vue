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

const route = useRoute();
const config = {};
const page = ref({ title: '', html: '', notFound: false });

const load = async (slug) => {
  page.value = await useLegalPage(slug, { config });
};

watch(() => route.params.slug, (s) => load(s), { immediate: true });
</script>
