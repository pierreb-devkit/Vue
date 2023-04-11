<template>
  <div>
    <homeBannerComponent v-bind:ratio="1" v-bind:app="config.app" v-bind:statusMargin="450"></homeBannerComponent>
    <homeAboutsComponent v-bind:abouts="config.home.abouts" v-bind:md="6" v-bind:custom="null"></homeAboutsComponent>
    <homeSlideshowComponent
      v-bind:slides="config.home.slideshow"
      v-bind:custom="{ section: { background: config.vuetify.theme.themes[theme].surface } }"
      v-bind:height="pageHeight / 1.75"
      v-bind:full="true"
      v-bind:interval="10000"
      v-bind:mdImage="null"
      v-bind:mdText="null"
    ></homeSlideshowComponent>
    <homeFeaturesComponent
      v-bind:features="config.home.features"
      v-bind:custom="{
        section: { background: config.vuetify.theme.themes[theme].colors.surface },
        card: { background: config.vuetify.theme.themes[theme].colors.background },
      }"
    ></homeFeaturesComponent>
    <homeStatsComponent v-bind:statistics="statistics"></homeStatsComponent>
    <homeAboutsComponent v-bind:abouts="config.home.abouts2" v-bind:custom="null" v-bind:md="6"></homeAboutsComponent>
    <!-- <homeLogosComponent
      v-bind:logos="config.home.suggestions"
      v-bind:size="75"
      v-bind:ratio="2"
      v-bind:custom="{
        section: { background: config.vuetify.theme.themes[theme].colors.surface },
        card: { background: config.vuetify.theme.themes[theme].colors.background },
      }"
    ></homeLogosComponent> -->
    <homeBlogComponent
      v-bind:title="config.home.blog.title"
      v-bind:url="config.home.blog.url"
      v-bind:news="news"
      v-bind:titled="config.home.blog.title"
      v-bind:urld="config.home.blog.url"
      v-bind:newsd="news2"
      v-bind:custom="{
        section: { background: config.vuetify.theme.themes[theme].colors.surface },
        card: { background: config.vuetify.theme.themes[theme].colors.background },
      }"
    ></homeBlogComponent>
    <homeContactComponent></homeContactComponent>
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

/**
 * Export default
 */
export default {
  data() {
    return {
      pageHeight: 0,
    };
  },
  components: {
    homeBannerComponent,
    homeAboutsComponent,
    homeFeaturesComponent,
    homeSlideshowComponent,
    homeStatsComponent,
    homeBlogComponent,
    homeContactComponent,
  },
  computed: {
    ...mapGetters(['theme', 'news', 'statistics', 'news2']),
  },
  created() {
    this.$store.dispatch('getStatistics').then(() => {
      this.$store.dispatch('getNews');
      this.$store.dispatch('getNews2');
    });
  },
  mounted() {
    this.pageHeight = window.innerHeight;
  },
};
</script>

<style>
.centered-input >>> input {
  text-align: center;
  font-size: 20px;
}
</style>
