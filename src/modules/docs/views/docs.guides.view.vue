<template>
  <v-container
    class="py-12"
    :style="{ 'max-width': config.vuetify.theme.maxWidth }"
  >
    <h1 class="text-h4 font-weight-bold mb-2">
      Guides
    </h1>
    <p class="text-body-1 text-medium-emphasis mb-8">
      Learn how to use the stack step by step.
    </p>

    <v-row>
      <v-col
        v-for="guide in guides"
        :key="guide.slug"
        cols="12"
        sm="6"
        md="4"
      >
        <v-card
          :class="config.vuetify.theme.rounded"
          class="pa-6 h-100 d-flex flex-column"
          variant="outlined"
          :to="{ name: 'DocsGuide', params: { slug: guide.slug } }"
        >
          <v-icon
            :icon="guide.icon"
            size="32"
            color="primary"
            class="mb-4"
          />
          <h2 class="text-h6 font-weight-bold mb-2">
            {{ guide.title }}
          </h2>
          <p class="text-body-2 text-medium-emphasis flex-grow-1">
            {{ guide.description }}
          </p>
          <div class="mt-4">
            <v-btn
              variant="text"
              color="primary"
              class="text-none text-body-medium pa-0"
              :to="{ name: 'DocsGuide', params: { slug: guide.slug } }"
            >
              Read guide
              <v-icon
                end
                icon="mdi-arrow-right"
              />
            </v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import config from '../../../lib/services/config';

const guides = [
  {
    slug: 'getting-started',
    title: 'Getting Started',
    description: 'Set up the stack, install dependencies, and make your first API call.',
    icon: 'mdi-rocket-launch-outline',
  },
  {
    slug: 'authentication',
    title: 'Authentication',
    description: 'Sign up, log in, manage JWT tokens, and handle password resets.',
    icon: 'mdi-shield-key-outline',
  },
  {
    slug: 'organizations',
    title: 'Organizations',
    description: 'Create teams, invite members, switch contexts, and manage roles.',
    icon: 'mdi-account-group-outline',
  },
];
</script>
