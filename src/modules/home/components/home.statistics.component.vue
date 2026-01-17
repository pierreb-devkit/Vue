<!--
  HomeStatisticsComponent
  =======================
  Unified statistics component with blur and parallax variants.

  USAGE:
  <homeStatisticsComponent
    variant="blur"
    :setup="statistics"
    :animation-speed="1.5"
    :background-colors="['#4a90c2', '#3d7eb0', '#2d6a9e', '#1e5a8c', '#164578']"
    :halo-colors="['#0891b2', '#0ea5e9', '#3b82f6', '#0284c7', '#0369a1']"
  />

  PROPS:
  - variant (String): 'blur' or 'parallax' (default: 'blur')
  - setup (Array): Array of { value: String, title: String }
  - image (String): Parallax background image (only for parallax variant)
  - animationSpeed (Number): Animation speed multiplier (only for blur variant, 1.5 recommended)
  - backgroundColors (Array): 5 colors for gradient background (only for blur variant)
  - haloColors (Array): 5 colors for animated halos (only for blur variant)

  CONFIG EXAMPLE (config.home.statistics):
  {
    variant: 'blur',
    blur: {
      animationSpeed: 1.5,
      light: {
        backgroundColors: ['#1e3a5f', '#2d4a6f', '#3d5a7f', '#4d6a8f', '#5d7a9f'],
        haloColors: ['#0891b2', '#0ea5e9', '#3b82f6', '#0284c7', '#0369a1'],
      },
      dark: {
        backgroundColors: ['#0a0a1a', '#1a1a3e', '#2d2d6b', '#3d3d8a', '#2563eb'],
        haloColors: ['#4f46e5', '#7c3aed', '#2563eb', '#6366f1', '#8b5cf6'],
      },
    },
    parallax: {
      image: '/images/parallax.webp',
    },
    content: [
      { value: '1000+', title: 'Users' },
      { value: '50', title: 'Releases' },
    ],
  }
-->
<template>
  <section id="statistics" :class="{ black: variant === 'parallax' }" :style="sectionStyle">
    <!-- Blur variant -->
    <homeBlurBackgroundComponent
      v-if="variant === 'blur'"
      :ratio="statsRatio"
      :animation-speed="animationSpeed"
      :background-colors="backgroundColors"
      :halo-colors="haloColors"
      no-margin
    >
      <v-container class="fill-height" :style="`max-width: ${config.vuetify.theme.maxWidth}`">
        <v-row v-if="setup && setup.length > 0" align="center" justify="center">
          <v-col v-for="({ value, title }, i) in setup" :key="i" md="3">
            <div class="text-center text-white" data-aos="fade">
              <div class="font-weight-black text-h3 text-md-h2 mb-4 stats-value" v-text="value"></div>
              <div class="text-uppercase text-body-1 stats-title" v-text="title"></div>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </homeBlurBackgroundComponent>

    <!-- Parallax variant -->
    <v-parallax v-else-if="variant === 'parallax'" :height="$vuetify.display.smAndDown ? 700 : 500" :src="image">
      <v-container class="fill-height" :style="`max-width: ${config.vuetify.theme.maxWidth}`">
        <v-row v-if="setup && setup.length > 0" align="center" justify="center">
          <v-col v-for="({ value, title }, i) in setup" :key="i" md="3">
            <div class="text-center text-white" data-aos="fade">
              <div class="font-weight-black text-h3 text-md-h2 mb-4" v-text="value"></div>
              <div class="text-uppercase text-body-1" v-text="title"></div>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </v-parallax>
  </section>
</template>

<script>
import { overlapStyle } from '../../../lib/helpers/theme';
import homeBlurBackgroundComponent from './utils/home.blur.background.component.vue';

export default {
  name: 'HomeStatisticsComponent',
  components: {
    homeBlurBackgroundComponent,
  },
  props: {
    variant: {
      type: String,
      default: 'blur',
      validator: (value) => ['blur', 'parallax'].includes(value),
    },
    setup: {
      type: Array,
      required: true,
    },
    // For parallax variant
    image: {
      type: String,
      default: '/images/parallax.webp',
    },
    // For blur variant - animation speed multiplier (1.5 recommended for stats - slower than banner)
    animationSpeed: {
      type: Number,
      default: 1.5,
    },
    // For blur variant - background gradient colors array (5 colors for gradient stops)
    backgroundColors: {
      type: Array,
      default: null,
    },
    // For blur variant - halo colors array (5 colors for each halo)
    haloColors: {
      type: Array,
      default: null,
    },
    // Overlap: slides section up into previous section
    overlap: {
      type: [Boolean, String, Object],
      default: false,
    },
  },
  computed: {
    statsRatio() {
      // Smaller ratio for stats section (taller)
      return this.$vuetify?.display?.smAndDown ? 1.5 : 2.5;
    },
    sectionStyle() {
      return {
        ...overlapStyle(this.overlap, this.$vuetify?.display),
      };
    },
  },
};
</script>

<style scoped>
.stats-value {
  text-shadow: 0 2px 20px rgba(0, 0, 0, 0.3);
}

.stats-title {
  text-shadow: 0 1px 10px rgba(0, 0, 0, 0.2);
  opacity: 0.9;
}
</style>
