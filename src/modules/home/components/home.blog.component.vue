<!--
  - Call example
    <homeBlogComponent
      v-bind:title="blog"
      v-bind:url="config.home.blog2.url"
      v-bind:news="news2"
      v-bind:custom="null"
    ></homeBlogComponent>
  - Data Example
    blog: {
      // actually dev for Ghost Blog
      title: 'Articles',
      url: 'https://blog.weareopensource.me',
      key: 'yourkey',
    },
-->
<template>
  <section id="blog" class="py-12" :style="custom && custom.section ? custom.section : null" v-if="news.length > 0">
    <v-container>
      <h2 class="display-1 font-weight-bold mb-3 pb-8 text-center text-uppercase" v-if="title">
        <a :href="url" style="font-weight: inherit; color: inherit !important">{{ title }}</a>
      </h2>
      <v-row>
        <v-col v-for="({ feature_image, excerpt, title, url }, i) in news" :key="i" cols="12" md="4" data-aos="fade-up">
          <a :href="url" target="_blank">
            <v-img :src="feature_image" class="mb-4 rounded-xl" height="200" max-width="100%"></v-img>
            <h3 class="mb-4 text--primary" v-text="title"></h3>
            <div class="subtitle-1 text--secondary">
              <vue-markdown :source="excerpt" />
            </div>
          </a>
        </v-col>
      </v-row>
    </v-container>
    <v-container>
      <h2 class="display-1 font-weight-bold mb-3 pb-8 text-center text-uppercase" v-if="titled">
        <a :href="urld" style="font-weight: inherit; color: inherit !important">{{ titled }}</a>
      </h2>
      <v-row>
        <v-col v-for="({ feature_image, excerpt, title, url }, i) in newsd" :key="i" cols="12" md="4" data-aos="fade-up">
          <a :href="url" target="_blank">
            <v-img :src="feature_image" class="mb-4 rounded-xl" height="200" max-width="100%"></v-img>
            <h3 class="mb-4 text--primary" v-text="title"></h3>
            <div class="subtitle-1 text--secondary">
              <vue-markdown :source="excerpt" />
            </div>
          </a>
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
  props: ['title', 'url', 'news', 'titled', 'urld', 'newsd', 'custom'],
  components: {
    VueMarkdown,
  },
};
</script>
