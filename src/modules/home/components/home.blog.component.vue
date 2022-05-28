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
      <h2 class="font-weight-bold mb-3 pb-8 text-h4 text-center" style="text-transform: uppercase !important" v-if="title">
        <a :href="url" style="font-weight: inherit; color: inherit !important">{{ titled }}</a>
      </h2>
      <v-row>
        <v-col v-for="({ feature_image, excerpt, title, url }, i) in news" :key="i" cols="12" md="4" data-aos="fade-up">
          <!-- eslint-disable-next-line -->
          <a :href="url" target="_blank">
            <v-img :src="feature_image" class="mb-4 rounded-xl" height="200" max-width="100%" cover></v-img>
            <h3 class="mb-4 text-primary" v-text="title"></h3>
            <div class="subtitle-1 text-medium-emphasis text-onSurface">
              <v-markdown :source="excerpt" />
            </div>
          </a>
        </v-col>
      </v-row>
    </v-container>
    <v-container>
      <h2 class="font-weight-bold mb-3 pb-8 text-h4 text-center" style="text-transform: uppercase !important" v-if="title">
        <a :href="urld" style="font-weight: inherit; color: inherit !important">{{ titled }}</a>
      </h2>
      <v-row>
        <v-col v-for="({ feature_image, excerpt, title, url }, i) in newsd" :key="i" cols="12" md="4" data-aos="fade-up">
          <a :href="url" target="_blank">
            <v-img :src="feature_image" class="mb-4 rounded-xl" height="200" max-width="100%" cover></v-img>
            <h3 class="mb-4 text-primary" v-text="title"></h3>
            <div class="subtitle-1 text-medium-emphasis text-onSurface">
              <v-markdown :source="excerpt" />
            </div>
          </a>
        </v-col>
      </v-row>
    </v-container>
  </section>
</template>

<script>
/**
 * Export default
 */
export default {
  name: 'homeBlogComponent',
  props: ['title', 'url', 'news', 'titled', 'urld', 'newsd', 'custom'],
};
</script>
