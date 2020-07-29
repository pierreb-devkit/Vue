<template>
  <div>
    <homeBannerComponent v-bind:ratio="1" v-bind:subscribe="true" v-bind:app="config.app"></homeBannerComponent>
    <homeAboutsComponent v-bind:abouts="config.home.abouts" v-bind:md="6" v-bind:custom="null"></homeAboutsComponent>
    <homeSlideshowComponent
      v-bind:slides="config.home.slideshow"
      v-bind:custom="{ section : { background: config.vuetify.theme.themes[theme].surface }}"
      v-bind:height="700"
      v-bind:full="true"
      v-bind:interval="10000"
    ></homeSlideshowComponent>
    <homeFeaturesComponent
      v-bind:features="config.home.features"
      v-bind:custom="{ section : { background: config.vuetify.theme.themes[theme].surface }, card: { background: config.vuetify.theme.themes[theme].background }}"
    ></homeFeaturesComponent>
    <homeFeaturesComponent
      v-bind:features="config.home.tools"
    ></homeFeaturesComponent>
    <homeStatsComponent v-bind:statistics="statistics"></homeStatsComponent>
    <homeAboutsComponent v-bind:abouts="config.home.abouts2" v-bind:custom="null" v-bind:md="6"></homeAboutsComponent>
    <homeBlogComponent
      v-bind:title="config.home.blog.title"
      v-bind:url="config.home.blog.url"
      v-bind:news="news"
      v-bind:custom="{ section : { background: config.vuetify.theme.themes[theme].surface }}"
    ></homeBlogComponent>
    <homeBlogComponent
      v-bind:title="config.home.blog2.title"
      v-bind:url="config.home.blog2.url"
      v-bind:news="news2"
      v-bind:custom="null"
    ></homeBlogComponent>
    <homeBlogComponent
      v-bind:title="config.home.blog3.title"
      v-bind:url="config.home.blog3.url"
      v-bind:news="news3"
      v-bind:custom="{ section : { background: config.vuetify.theme.themes[theme].surface }}"
    ></homeBlogComponent>
    <homeContactComponent></homeContactComponent>
    <homeLinksComponent
      v-bind:links="config.home.links"
      v-bind:custom="{ section: { background: config.vuetify.theme.themes[theme].surface }}"
    ></homeLinksComponent>
  </div>
</template>

<script>
/**
 * Module dependencies.
 */
import { mapGetters } from 'vuex';
import AOS from 'aos';
import 'aos/dist/aos.css';
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
    ...mapGetters(['theme', 'news', 'statistics', 'news2', 'news3']),
  },
  created() {
    AOS.init();
    this.$store.dispatch('getStatistics').then(() => {
      this.$store.dispatch('getNews');
      this.$store.dispatch('getNews2');
      this.$store.dispatch('getNews3');
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
