<!--
  HomeStatisticsComponent
  =======================
  Statistics component with animated blur background and scroll-triggered counters.

  USAGE:
  <homeStatisticsComponent
    :setup="statistics"
    :animated="true"
    :animation-duration="1500"
    :animation-speed="1.5"
    :background-colors="['#4a90c2', '#3d7eb0', '#2d6a9e', '#1e5a8c', '#164578']"
    :halo-colors="['#0891b2', '#0ea5e9', '#3b82f6', '#0284c7', '#0369a1']"
  />

  PROPS:
  - setup (Array): Array of { value: String, title: String }
  - animated (Boolean): Enable counter animation (default: true)
  - animationDuration (Number): Counter animation duration in ms (default: 1500)
  - animationSpeed (Number): Animation speed multiplier (1.5 recommended)
  - backgroundColors (Array): 5 colors for gradient background
  - haloColors (Array): 5 colors for animated halos
  - colorMode (String): 'light' | 'dark' | null — force text color mode

  CONFIG EXAMPLE (config.home.statistics):
  {
    animated: true,
    animationDuration: 1500,
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
    content: [
      { value: '1000+', title: 'Users' },
      { value: '50', title: 'Releases' },
    ],
  }
-->
<template>
  <section id="statistics" ref="sectionRef" :style="sectionStyle">
    <homeBlurBackgroundComponent
      :ratio="statsRatio"
      :animation-speed="animationSpeed"
      :background-colors="backgroundColors"
      :halo-colors="haloColors"
      no-margin
    >
      <v-container class="fill-height" :style="`max-width: ${config.vuetify.theme.maxWidth}`">
        <v-row v-if="setup && setup.length > 0" class="fill-height" align="center" justify="center">
          <v-col v-for="({ value, title }, i) in setup" :key="i" cols="6" md="3">
            <div class="text-center" :class="colorMode ? '' : 'text-white'" data-aos="fade">
              <div
                class="font-weight-black text-display-small text-md-display-medium mb-4 stats-value"
                v-text="displayValues[i] != null ? displayValues[i] : value"
              ></div>
              <div class="text-uppercase text-body-large stats-title" v-text="title"></div>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </homeBlurBackgroundComponent>
  </section>
</template>

<script>
import { overlapStyle, colorModeStyle } from '../../../lib/helpers/theme';
import homeBlurBackgroundComponent from './utils/home.blur.background.component.vue';

/**
 * Parse a stat value string into numeric target + prefix/suffix.
 * Examples: "1000+" -> { num: 1000, prefix: "", suffix: "+", decimals: 0 }
 *           "x2.08" -> { num: 2.08, prefix: "x", suffix: "", decimals: 2 }
 *           "50m"   -> { num: 50, prefix: "", suffix: "m", decimals: 0 }
 */
function parseStatValue(raw) {
  const str = String(raw);
  const match = str.match(/^([^\d]*?)([\d]+(?:\.[\d]+)?)(.*)$/);
  if (!match) return null;
  const num = parseFloat(match[2]);
  if (Number.isNaN(num)) return null;
  const decPart = match[2].split('.')[1];
  return {
    num,
    prefix: match[1],
    suffix: match[3],
    decimals: decPart ? decPart.length : 0,
  };
}

/** Cubic ease-out: 1 - (1 - t)^3 */
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

export default {
  name: 'HomeStatisticsComponent',
  components: {
    homeBlurBackgroundComponent,
  },
  props: {
    setup: {
      type: Array,
      required: true,
    },
    // Enable counter animation (default: true)
    animated: {
      type: Boolean,
      default: true,
    },
    // Counter animation duration in ms
    animationDuration: {
      type: Number,
      default: 1500,
    },
    // Animation speed multiplier (1.5 recommended for stats - slower than banner)
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
    // Force text color mode: 'light' (white text), 'dark' (dark text), or null (auto)
    colorMode: {
      type: String,
      default: null,
      validator: (value) => value === null || ['light', 'dark'].includes(value),
    },
  },
  data() {
    return {
      displayValues: [],
      hasAnimated: false,
      observer: null,
      animationFrameIds: [],
    };
  },
  computed: {
    statsRatio() {
      // Smaller ratio for stats section (taller)
      return this.$vuetify?.display?.smAndDown ? 1.5 : 2.5;
    },
    /**
     * Builds the inline styles for the statistics section.
     * @returns {Object} The merged overlap and color-mode styles.
     */
    sectionStyle() {
      return {
        ...overlapStyle(this.overlap, this.$vuetify?.display),
        ...colorModeStyle(this.colorMode),
      };
    },
    /** Whether animation should be skipped (disabled or prefers-reduced-motion). */
    shouldAnimate() {
      if (!this.animated) return false;
      if (typeof window !== 'undefined' && window.matchMedia) {
        return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      }
      return true;
    },
  },
  watch: {
    setup: {
      handler() {
        this.initDisplayValues();
        // Re-observe when setup data changes (e.g. async fetch)
        if (!this.hasAnimated && this.shouldAnimate) {
          this.$nextTick(() => this.observeSection());
        }
      },
      deep: true,
    },
  },
  mounted() {
    this.initDisplayValues();
    if (this.shouldAnimate) {
      this.observeSection();
    }
  },
  beforeUnmount() {
    this.cleanup();
  },
  methods: {
    /** Initialise displayValues — show final values when not animating, "0" otherwise. */
    initDisplayValues() {
      if (!this.setup) return;
      if (!this.shouldAnimate || this.hasAnimated) {
        this.displayValues = this.setup.map((s) => s.value);
      } else {
        this.displayValues = this.setup.map((s) => {
          const parsed = parseStatValue(s.value);
          return parsed ? `${parsed.prefix}0${parsed.suffix}` : s.value;
        });
      }
    },
    /** Set up IntersectionObserver on the section element. */
    observeSection() {
      this.cleanupObserver();
      const el = this.$refs.sectionRef;
      if (!el) return;
      this.observer = new IntersectionObserver(
        (entries) => {
          if (entries[0] && entries[0].isIntersecting && !this.hasAnimated) {
            this.hasAnimated = true;
            this.startCounters();
            this.cleanupObserver();
          }
        },
        { threshold: 0.4 },
      );
      this.observer.observe(el);
    },
    /** Animate all counters from 0 to their target values. */
    startCounters() {
      if (!this.setup) return;
      this.setup.forEach((stat, i) => {
        const parsed = parseStatValue(stat.value);
        if (!parsed) {
          this.displayValues[i] = stat.value;
          return;
        }
        const start = performance.now();
        const duration = this.animationDuration;
        const step = (now) => {
          const elapsed = now - start;
          const t = Math.min(elapsed / duration, 1);
          const eased = easeOutCubic(t);
          const current = eased * parsed.num;
          const formatted = parsed.decimals > 0 ? current.toFixed(parsed.decimals) : String(Math.round(current));
          this.displayValues[i] = `${parsed.prefix}${formatted}${parsed.suffix}`;
          if (t < 1) {
            this.animationFrameIds[i] = requestAnimationFrame(step);
          } else {
            // Ensure exact final value
            this.displayValues[i] = stat.value;
          }
        };
        this.animationFrameIds[i] = requestAnimationFrame(step);
      });
    },
    /** Clean up observer. */
    cleanupObserver() {
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }
    },
    /** Clean up all resources. */
    cleanup() {
      this.cleanupObserver();
      this.animationFrameIds.forEach((id) => {
        if (id) cancelAnimationFrame(id);
      });
      this.animationFrameIds = [];
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
