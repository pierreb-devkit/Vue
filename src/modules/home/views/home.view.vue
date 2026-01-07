<template>
  <div>
    <homeBannerComponent
      v-if="config.home.banner"
      :title="config.home.banner.title"
      :subtitle="config.home.banner.subtitle"
      :button="config.home.banner.button"
    ></homeBannerComponent>
    <homeVideoComponent v-if="config.home.video" :setup="config.home.video"></homeVideoComponent>
    <homeContentsComponent v-if="config.home.punchline" :setup="config.home.punchline"></homeContentsComponent>
    <homeContentsComponent v-if="config.home.features" :setup="config.home.features"></homeContentsComponent>
    <homeCardsComponent v-if="config.home.repos" :setup="config.home.repos"></homeCardsComponent>
    <homeIconsComponent v-if="config.home.ressources" :setup="config.home.ressources"></homeIconsComponent>
    <homeTimelineComponent v-if="config.home.install" :setup="config.home.install"></homeTimelineComponent>
    <homeSlideshowComponent v-if="config.home.designs" :setup="config.home.designs"></homeSlideshowComponent>
    <homeLogosComponent v-if="config.home.partners" :setup="config.home.partners"></homeLogosComponent>
    <homeImagesComponent v-if="config.home.blog && news.length > 0" :setup="{ content: news, ...config.home.blog }"></homeImagesComponent>
    <homeParallaxComponent v-if="config.home.stats" :setup="statistics"></homeParallaxComponent>
    <homeContactComponent v-if="config.home.contact"></homeContactComponent>
  </div>
</template>

<script>
/**
 * Module dependencies.
 */
import { useCoreStore } from '../../core/stores/core.store';
import { useHomeStore } from '../stores/home.store';
import homeBannerComponent from '../components/home.banner.component.vue';
import homeVideoComponent from '../components/home.video.component.vue';
import homeContentsComponent from '../components/home.contents.component.vue';
import homeCardsComponent from '../components/home.cards.component.vue';
import homeLogosComponent from '../components/home.logos.component.vue';
import homeIconsComponent from '../components/home.icons.component.vue';
import homeTimelineComponent from '../components/home.timeline.component.vue';
import homeSlideshowComponent from '../components/home.slideshow.component.vue';
import homeImagesComponent from '../components/home.images.component.vue';
import homeParallaxComponent from '../components/home.parallax.component.vue';
import homeContactComponent from '../components/home.contact.component.vue';

/**
 * Component definition.
 */
export default {
  data() {
    return {
      pageHeight: 0,
    };
  },
  components: {
    homeBannerComponent,
    homeVideoComponent,
    homeContentsComponent,
    homeCardsComponent,
    homeLogosComponent,
    homeIconsComponent,
    homeTimelineComponent,
    homeSlideshowComponent,
    homeParallaxComponent,
    homeImagesComponent,
    homeContactComponent,
  },
  computed: {
    theme() {
      const coreStore = useCoreStore();
      return coreStore.theme;
    },
    news() {
      const homeStore = useHomeStore();
      return homeStore.news;
    },
    statistics() {
      const homeStore = useHomeStore();
      return homeStore.statistics;
    },
  },
  created() {
    const homeStore = useHomeStore();
    if (this.config.home.stats) homeStore.getStatistics();
    if (this.config.home.blog) homeStore.getNews();
  },
  mounted() {
    this.pageHeight = window.innerHeight;
  },
};
</script>

<style>
.centered-input :deep(input) {
  text-align: center;
  font-size: 20px;
}
</style>
