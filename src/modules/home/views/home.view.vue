<template>
  <div>
    <homeBannerComponent v-bind:ratio="1" v-bind:app="config.app" v-bind:statusMargin="450"></homeBannerComponent>
    <homeAboutsComponent v-bind:abouts="config.home.abouts" v-bind:md="6" v-bind:custom="null"></homeAboutsComponent>
    <homeFeaturesComponent
      v-bind:features="config.home.features"
      v-bind:custom="{
        section: { background: config.vuetify.theme.themes[theme].surface },
        card: { background: config.vuetify.theme.themes[theme].background },
      }"
    ></homeFeaturesComponent>
    <homeSlideshowComponent
      v-bind:slides="config.home.slideshow"
      v-bind:custom="null"
      v-bind:height="350"
      v-bind:mdImage="8"
      v-bind:mdText="4"
      v-bind:full="false"
      v-bind:interval="6000"
    ></homeSlideshowComponent>
    <homeStatsComponent v-bind:statistics="statistics"></homeStatsComponent>
    <homeBlogComponent
      v-bind:title="config.home.blog.title"
      v-bind:url="config.home.blog.url"
      v-bind:news="news"
      v-bind:custom="{
        section: { background: config.vuetify.theme.themes[theme].surface },
      }"
    ></homeBlogComponent>
    <homeContactComponent></homeContactComponent>
    <homeLinksComponent
      v-bind:links="config.home.links"
      v-bind:custom="{
        section: { background: config.vuetify.theme.themes[theme].surface },
      }"
    ></homeLinksComponent>
  </div>
</template>

<script>
/**
 * Module dependencies.
 */
import { mapGetters } from 'vuex';
import homeBannerComponent from '../components/home.banner.component.vue';
import homeAboutsComponent from '../components/home.abouts.component.vue';
import homeFeaturesComponent from '../components/home.features.component.vue';
import homeSlideshowComponent from '../components/home.slideshow.component.vue';
import homeStatsComponent from '../components/home.stats.component.vue';
import homeBlogComponent from '../components/home.blog.component.vue';
import homeContactComponent from '../components/home.contact.component.vue';
import homeLinksComponent from '../components/home.links.component.vue';

/**
 * Export default
 */
export default {
  components: {
    homeBannerComponent,
    homeAboutsComponent,
    homeFeaturesComponent,
    homeSlideshowComponent,
    homeStatsComponent,
    homeBlogComponent,
    homeContactComponent,
    homeLinksComponent,
  },
  computed: {
    ...mapGetters(['theme', 'news', 'statistics']),
  },
  created() {
    this.$store.dispatch('getStatistics').then(() => {
      this.$store.dispatch('getNews');
    });
  },
};
</script>

<style>
.centered-input >>> input {
  text-align: center;
  font-size: 20px;
}
</style>
