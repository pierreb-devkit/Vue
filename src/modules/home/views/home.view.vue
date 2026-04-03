<template>
  <div>
    <!-- Hero Banner -->
    <homeHeroComponent
      v-if="config.home.hero"
      :variant="config.home.hero.variant || 'blur'"
      :title="config.home.hero.title"
      :subtitle="config.home.hero.subtitle"
      :button="config.home.hero.button"
      :banner="config.home.hero.img?.image"
      :ratio="config.home.hero.variant === 'img' ? config.home.hero.img?.ratio : null"
      :animation-speed="config.home.hero.blur?.animationSpeed || 1"
      :background-colors="themeName === 'dark' ? config.home.hero.blur?.dark?.backgroundColors : config.home.hero.blur?.light?.backgroundColors"
      :halo-colors="themeName === 'dark' ? config.home.hero.blur?.dark?.haloColors : config.home.hero.blur?.light?.haloColors"
      :overlap="config.home.hero.overlap"
    ></homeHeroComponent>
    <homePresentationComponent v-if="config.home.presentation" :setup="config.home.presentation"></homePresentationComponent>
    <homeSocialComponent v-if="config.home.social" :setup="config.home.social"></homeSocialComponent>
    <homeAboutComponent v-if="config.home.about" :setup="config.home.about"></homeAboutComponent>
    <homeAboutComponent v-if="config.home.aboutFeatures" :setup="config.home.aboutFeatures"></homeAboutComponent>
    <homeCapabilitiesComponent v-if="config.home.capabilities" :setup="config.home.capabilities"></homeCapabilitiesComponent>
    <homeFeaturesComponent v-if="config.home.features" :setup="config.home.features"></homeFeaturesComponent>
    <homeServicesComponent v-if="config.home.services" :setup="config.home.services"></homeServicesComponent>
    <homeStepsComponent v-if="config.home.steps" :setup="config.home.steps"></homeStepsComponent>
    <homeGalleryComponent v-if="config.home.gallery" :setup="config.home.gallery"></homeGalleryComponent>
    <homeArticlesComponent v-if="config.home.articles && news.length > 0" :setup="{ content: news, ...config.home.articles }"></homeArticlesComponent>
    <homeStatisticsComponent
      v-if="config.home.statistics"
      :setup="statistics"
      :animated="config.home.statistics.animated !== false"
      :animation-duration="config.home.statistics.animationDuration ?? 1500"
      :animation-speed="config.home.statistics.blur?.animationSpeed || 1.5"
      :background-colors="
        themeName === 'dark' ? config.home.statistics.blur?.dark?.backgroundColors : config.home.statistics.blur?.light?.backgroundColors
      "
      :halo-colors="themeName === 'dark' ? config.home.statistics.blur?.dark?.haloColors : config.home.statistics.blur?.light?.haloColors"
      :color-mode="config.home.statistics.colorMode"
    ></homeStatisticsComponent>
    <homeFaqComponent v-if="config.home.faq" :setup="config.home.faq"></homeFaqComponent>
    <homeCtaComponent v-if="config.home.cta" :setup="config.home.cta"></homeCtaComponent>
    <homeContactComponent v-if="config.home.contact"></homeContactComponent>
  </div>
</template>

<script>
/**
 * Module dependencies.
 */
import { useTheme } from 'vuetify';
import { useHomeStore } from '../stores/home.store';

// === Imports alignés avec la configuration ===
import homeHeroComponent from '../components/home.hero.component.vue';
import homePresentationComponent from '../components/home.presentation.component.vue';
import homeAboutComponent from '../components/home.about.component.vue';
import homeCapabilitiesComponent from '../components/home.capabilities.component.vue';
import homeFeaturesComponent from '../components/home.features.component.vue';
import homeServicesComponent from '../components/home.services.component.vue';
import homeStepsComponent from '../components/home.steps.component.vue';
import homeGalleryComponent from '../components/home.gallery.component.vue';
import homeSocialComponent from '../components/home.social.component.vue';
import homeArticlesComponent from '../components/home.articles.component.vue';
import homeStatisticsComponent from '../components/home.statistics.component.vue';
import homeFaqComponent from '../components/home.faq.component.vue';
import homeCtaComponent from '../components/home.cta.component.vue';
import homeContactComponent from '../components/home.contact.component.vue';

/**
 * Component definition.
 */
export default {
  components: {
    // Noms alignés avec la configuration
    homeHeroComponent,
    homePresentationComponent,
    homeAboutComponent,
    homeCapabilitiesComponent,
    homeFeaturesComponent,
    homeServicesComponent,
    homeStepsComponent,
    homeGalleryComponent,
    homeSocialComponent,
    homeArticlesComponent,
    homeStatisticsComponent,
    homeFaqComponent,
    homeCtaComponent,
    homeContactComponent,
  },
  data() {
    const theme = useTheme();
    return {
      theme,
    };
  },
  computed: {
    themeName() {
      return this.theme.name;
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
    if (this.config.home.statistics) {
      homeStore.initStatistics();
      homeStore.getStatistics();
    }
    if (this.config.home.articles) homeStore.getNews();
  },
};
</script>

<style>
.centered-input :deep(input) {
  text-align: center;
  font-size: 20px;
}
</style>
