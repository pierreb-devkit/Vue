<!--
  HomeHeroComponent
  =================
  Unified hero/banner component with blur and img variants.

  USAGE:
  <homeHeroComponent
    variant="blur"
    :title="'Welcome to **our site**'"
    :subtitle="'Build faster with modern tools'"
    :button="{ title: 'Get Started', link: '/signup' }"
    :ratio="3"
    :animation-speed="1"
    :background-colors="['#4a90c2', '#3d7eb0', '#2d6a9e', '#1e5a8c', '#164578']"
    :halo-colors="['#0891b2', '#0ea5e9', '#3b82f6', '#0284c7', '#0369a1']"
  />

  PROPS:
  - variant (String): 'blur' or 'img' (default: 'blur')
  - title (String): Main title, supports markdown
  - subtitle (String): Subtitle text, supports markdown
  - button (Object): { title: String, color: String, link: String }
  - ratio (Number|String): Height ratio (e.g., 3 = 33vh), null for full banner
  - banner (String): Custom banner image URL (only for img variant)
  - animationSpeed (Number): Animation speed multiplier (only for blur variant, 1 = default)
  - backgroundColors (Array): 5 colors for gradient background (only for blur variant)
  - haloColors (Array): 5 colors for animated halos (only for blur variant)
  - overlap (Boolean|String|Object): Slides section up into previous section. true = default (-40vh desktop / -20vh mobile), String = custom value (e.g. '10vh'), Object = { desktop: '40vh', mobile: '20vh' }

  CONFIG EXAMPLE (config.home.hero):
  {
    variant: 'blur',
    blur: {
      animationSpeed: 1,
      light: {
        backgroundColors: ['#4a90c2', '#3d7eb0', '#2d6a9e', '#1e5a8c', '#164578'],
        haloColors: ['#0891b2', '#0ea5e9', '#3b82f6', '#0284c7', '#0369a1'],
      },
      dark: {
        backgroundColors: ['#0a0a1a', '#1a1a3e', '#2d2d6b', '#3d3d8a', '#2563eb'],
        haloColors: ['#4f46e5', '#7c3aed', '#2563eb', '#6366f1', '#8b5cf6'],
      },
    },
    img: {
      lightBackground: '/images/light.webp',
      darkBackground: '/images/dark.webp',
    }
  }
-->
<template>
  <section id="hero">
    <!-- Blur variant -->
    <homeBlurBackgroundComponent
      v-if="variant === 'blur'"
      :ratio="ratio"
      :animation-speed="animationSpeed"
      :background-colors="backgroundColors"
      :halo-colors="haloColors"
    >
      <v-container class="fill-height" :style="containerStyle">
        <v-row class="fill-height" align="center" justify="center">
          <v-col class="text-white text-center">
            <h1 class="mb-5 font-weight-bold text-headline-large text-md-display-medium blur-title">
              <VMarkdown v-if="title" :source="title" inline />
            </h1>
            <p class="mb-10 font-weight-medium text-body-large text-md-headline-small blur-subtitle">
              <VMarkdown v-if="subtitle" :source="subtitle" inline />
            </p>
            <v-btn
              v-if="button && button.title"
              :href="button.link"
              class="text-none font-weight-bold blur-btn"
              :class="config.vuetify.theme.rounded"
              :style="buttonStyle"
              variant="flat"
              size="large"
            >
              {{ button.title }}
            </v-btn>
          </v-col>
        </v-row>
      </v-container>
    </homeBlurBackgroundComponent>

    <!-- Img variant -->
    <v-img
      v-else-if="variant === 'img'"
      :height="ratio ? `calc(${100 / ratio}vh)` : $vuetify.display.smAndDown ? '65vh' : '85vh'"
      :src="banner ? banner : generateBackground()"
      style="margin-top: -65px"
      max-width="100%"
      cover
      :alt="title ? title + ' hero' : 'Hero banner'"
    >
      <v-container class="fill-height" :style="containerStyle">
        <v-row class="fill-height" align="center" justify="center">
          <v-col class="text-white text-center">
            <h1 class="mb-5 font-weight-bold text-headline-large text-md-display-medium"><VMarkdown v-if="title" :source="title" inline /></h1>
            <p class="mb-10 font-weight-medium text-body-large text-md-headline-small"><VMarkdown v-if="subtitle" :source="subtitle" inline /></p>
            <v-btn
              v-if="button && button.title"
              :href="button.link"
              class="text-none font-weight-bold rounded-xl"
              :style="{ 'border-color': button.color, 'border-width': '1.5px' }"
              variant="outlined"
              size="large"
            >
              {{ button.title }}
            </v-btn>
          </v-col>
        </v-row>
      </v-container>
    </v-img>
  </section>
</template>

<script>
import { useTheme } from 'vuetify';
import homeBlurBackgroundComponent from './utils/home.blur.background.component.vue';
import { liquidGlassStyle } from '../../../lib/helpers/theme';

export default {
  name: 'HomeHeroComponent',
  components: {
    homeBlurBackgroundComponent,
  },
  props: {
    variant: {
      type: String,
      default: 'blur',
      validator: (value) => ['blur', 'img'].includes(value),
    },
    ratio: {
      type: [Number, String],
      default: null,
    },
    title: {
      type: String,
      default: null,
    },
    subtitle: {
      type: String,
      default: null,
    },
    button: {
      type: Object,
      default: () => ({}),
    },
    // For img variant
    banner: {
      type: String,
      default: null,
    },
    // For blur variant - animation speed multiplier (1 = default, 0.5 = twice as fast, 2 = twice as slow)
    animationSpeed: {
      type: Number,
      default: 1,
    },
    // For blur variant - background gradient colors array (4-5 colors for gradient stops)
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
    /**
     * Compute container padding to vertically center content in the visible hero area.
     * Accounts for the 65px navbar overlap at the top and the optional overlap prop at the bottom.
     * @returns {{ 'padding-top': string, 'padding-bottom': string }} Style object with top and bottom padding.
     */
    containerStyle() {
      const isSmAndDown = this.$vuetify?.display?.smAndDown;
      let paddingBottom = '0px';
      if (this.overlap === true) {
        paddingBottom = isSmAndDown ? '18vh' : '35vh';
      } else if (typeof this.overlap === 'string') {
        paddingBottom = this.overlap;
      } else if (typeof this.overlap === 'object' && this.overlap) {
        paddingBottom = isSmAndDown ? this.overlap.mobile || '18vh' : this.overlap.desktop || '35vh';
      }
      return { 'padding-top': '15vh', 'padding-bottom': paddingBottom };
    },
    buttonStyle() {
      return {
        ...liquidGlassStyle({
          vuetifyTheme: this.theme,
          intensity: 1,
          tint: 0.5,
          variant: 'pill',
          border: 'none',
          glowBorder: true,
          extras: {
            color: '#fff',
          },
        }),
        transition: 'all 0.3s ease',
      };
    },
  },
  methods: {
    generateBackground() {
      return this.themeName === 'dark' ? this.config.home.hero?.img?.darkBackground : this.config.home.hero?.img?.lightBackground;
    },
  },
};
</script>

<style scoped>
/* ============================================
   CONTENT STYLES
   ============================================ */

.blur-title :deep(*) {
  text-shadow: 0 2px 20px rgba(0, 0, 0, 0.3);
}

.blur-subtitle :deep(*) {
  text-shadow: 0 1px 10px rgba(0, 0, 0, 0.2);
  opacity: 0.95;
}

.blur-btn {
  position: relative;
}

.blur-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(var(--glow-rotation, 135deg), rgba(255, 255, 255, 1), rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.4));
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

.blur-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}
</style>
