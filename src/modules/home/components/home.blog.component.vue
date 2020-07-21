<template>
  <section
    id="blog"
    class="py-12"
    :style="custom && custom.section ? custom.section : null"
    v-if="news.length > 0"
  >
    <v-container>
      <h2
        class="display-1 font-weight-bold mb-3 pb-8 text-center text-uppercase"
        v-if="config.home.blog.title"
      >
        <a :href="config.home.blog.url" style="font-weight:inherit; color:inherit !important;">
          {{
          config.home.blog.title
          }}
        </a>
      </h2>
      <v-row>
        <v-col
          v-for="({ feature_image, excerpt, title, url }, i) in news"
          :key="i"
          cols="12"
          md="4"
        >
          <v-img :src="feature_image" class="mb-4" height="275" max-width="100%"></v-img>
          <h3 class="mb-4 text--primary" v-text="title"></h3>
          <div class="subtitle-1 text--secondary">
            <vue-markdown :source="excerpt" />
          </div>
          <v-btn class="ml-n5 font-weight-black" :href="url" target="_blank" text>Continue Reading</v-btn>
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
  name: 'homeBlogComponent',
  props: ['news', 'custom'],
  components: {
    VueMarkdown,
  },
};
</script>
