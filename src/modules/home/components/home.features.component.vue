<template>
  <section
    id="features"
    class="py-12"
    :style="custom && custom.section ? custom.section : null"
    v-if="features.data.length > 0"
  >
    <v-container class="text-center">
      <h2
        class="display-1 font-weight-bold mb-3 pb-8 text-uppercase"
        v-if="features.title"
      >{{ features.title }}</h2>
      <v-row>
        <v-col
          v-for="({ icon, title, text }, i) in features.data"
          :key="i"
          cols="12"
          md="4"
        >
          <v-card
            class="py-12 px-4"
            :flat="config.vuetify.theme.flat"
            :style="custom && custom.card ? custom.card : null"
          >
            <div>
              <v-avatar color="primary" size="88">
                <v-icon dark large data-aos="fade-up">{{ icon }}</v-icon>
              </v-avatar>
            </div>
            <v-card-title class="justify-center font-weight-black text-uppercase" v-text="title"></v-card-title>
            <v-card-text class="subtitle-1 text--secondary">
              <vue-markdown :source="text" />
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </section>
</template>

<script>
/**
 * Module dependencies.
 */
import VueMarkdown from 'vue-markdown';
/**
 * Export default
 */
export default {
  name: 'homeAboutsComponent',
  props: ['features', 'custom'],
  components: {
    VueMarkdown,
  },
};
</script>
