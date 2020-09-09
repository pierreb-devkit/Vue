<template>
  <section
    id="about-me"
    v-if="abouts.length > 0"
    :style="custom && custom.section ? custom.section : null"
  >
    <v-container class="text-center pb-12">
      <v-row align="center" justify="center">
        <v-col
          v-for="({ title, text, image, button, link }, i) in abouts"
          :key="i"
          cols="12"
          :md="md"
        >
          <h2 class="display-1 font-weight-bold mb-3 py-8 text-uppercase" v-text="title"></h2>
          <v-responsive class="mx-auto title font-weight-light mb-8" max-width="720">
            <vue-markdown :source="text" />
          </v-responsive>
          <v-avatar v-if="image" class="elevation-12 mb-12" size="128">
            <v-img :src="image"></v-img>
          </v-avatar>
          <br v-if="link" />
          <v-btn v-if="link" color="grey" :href="link" outlined large>
            <span class="grey--text text--darken-1 font-weight-bold" v-text="button"></span>
          </v-btn>
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
  props: ['abouts', 'custom', 'md'],
  components: {
    VueMarkdown,
  },
};
</script>
