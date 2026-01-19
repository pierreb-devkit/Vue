<!--
  HomeBlurBackgroundComponent
  ===========================
  Reusable animated blur background with traversing halo effects.
  Use as a wrapper with slot for content.

  USAGE:
  <homeBlurBackgroundComponent
    :ratio="3"
    :animation-speed="1"
    :background-colors="['#4a90c2', '#3d7eb0', '#2d6a9e', '#1e5a8c', '#164578']"
    :halo-colors="['#0891b2', '#0ea5e9', '#3b82f6', '#0284c7', '#0369a1']"
  >
    <template #default>
      <your-content />
    </template>
  </homeBlurBackgroundComponent>

  PROPS:
  - ratio (Number|String): Height ratio (e.g., 3 = 33vh), null for full height
  - animationSpeed (Number): Animation speed multiplier (1 = default, 0.5 = faster, 2 = slower)
  - backgroundColors (Array): 5 colors for gradient background
  - haloColors (Array): 5 colors for animated halos
  - noMargin (Boolean): If true, removes the -65px top margin (for non-banner usage)

  CONFIG EXAMPLE:
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
  }
-->
<template>
  <div class="blur-background" :class="[themeName, { 'no-margin': noMargin }]">
    <!-- Background layers -->
    <div class="blur-bg">
      <!-- Base gradient layer -->
      <div class="blur-sky" :style="skyStyle"></div>

      <!-- Halo/Blob layers -->
      <div class="halo-container">
        <div class="halo halo-1" :style="haloStyle(0)"></div>
        <div class="halo halo-2" :style="haloStyle(1)"></div>
        <div class="halo halo-3" :style="haloStyle(2)"></div>
        <div class="halo halo-4" :style="haloStyle(3)"></div>
        <div class="halo halo-5" :style="haloStyle(4)"></div>
      </div>

      <!-- Glass overlay -->
      <div class="blur-glass"></div>
    </div>

    <!-- Content slot -->
    <div class="blur-content">
      <slot></slot>
    </div>
  </div>
</template>

<script>
import { useTheme } from 'vuetify';
import { lightenColor } from '../../../../lib/helpers/theme';

export default {
  name: 'HomeBlurBackgroundComponent',
  props: {
    ratio: {
      type: [Number, String],
      default: null,
    },
    // Animation speed multiplier (1 = default, 0.5 = twice as fast, 2 = twice as slow)
    animationSpeed: {
      type: Number,
      default: 1,
    },
    // Background gradient colors array (5 colors for gradient stops)
    backgroundColors: {
      type: Array,
      default: null,
    },
    // Halo colors array (5 colors for each halo)
    haloColors: {
      type: Array,
      default: null,
    },
    // Remove top margin (for non-banner usage like stats)
    noMargin: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    const theme = useTheme();
    // Generate random delay offsets once on component creation
    return {
      theme,
      randomDelayOffsets: Array.from({ length: 5 }, () => -Math.random()),
    };
  },
  computed: {
    themeName() {
      return this.theme.name;
    },
    backgroundHeight() {
      if (this.ratio) return `calc(${100 / this.ratio}vh)`;
      return this.$vuetify?.display?.smAndDown ? '70vh' : '90vh';
    },
    // Default colors based on theme
    defaultBackgroundColors() {
      const isDark = this.themeName === 'dark';
      return isDark ? ['#0a0a1a', '#1a1a3e', '#2d2d6b', '#3d3d8a', '#2563eb'] : ['#4a90c2', '#3d7eb0', '#2d6a9e', '#1e5a8c', '#164578'];
    },
    defaultHaloColors() {
      const isDark = this.themeName === 'dark';
      return isDark ? ['#4f46e5', '#7c3aed', '#2563eb', '#6366f1', '#8b5cf6'] : ['#0891b2', '#0ea5e9', '#3b82f6', '#0284c7', '#0369a1'];
    },
    skyStyle() {
      const colors = this.backgroundColors || this.defaultBackgroundColors;
      const stops = `${colors[0]} 0%, ${colors[1]} 25%, ${colors[2]} 50%, ${colors[3]} 75%, ${colors[4]} 100%`;
      return {
        background: `linear-gradient(150deg, ${stops})`,
      };
    },
    // Animation durations based on speed multiplier
    animationDurations() {
      const baseDurations = [20, 25, 22, 28, 30];
      return baseDurations.map((d) => `${d * this.animationSpeed}s`);
    },
  },
  methods: {
    haloStyle(index) {
      const colors = this.haloColors || this.defaultHaloColors;
      const color = colors[index] || colors[0];
      const isDark = this.themeName === 'dark';

      // Opacity adjustments for theme
      const darkOpacities = [0.7, 0.6, 0.7, 0.5, 0.4];
      const lightOpacities = [0.8, 0.8, 0.8, 0.8, 0.6];
      const opacity = isDark ? darkOpacities[index] : lightOpacities[index];

      // Build gradient
      const gradient = `radial-gradient(circle, ${color} 0%, ${lightenColor(color, 20)} 40%, transparent 70%)`;

      // Random start positions
      const duration = parseFloat(this.animationDurations[index]);
      const delay = this.randomDelayOffsets[index] * duration;

      return {
        background: gradient,
        opacity,
        animationDuration: this.animationDurations[index],
        animationDelay: `${delay}s`,
      };
    },
  },
};
</script>

<style scoped>
/* ============================================
   BLUR BACKGROUND - CONTAINER
   ============================================ */
.blur-background {
  position: relative;
  width: 100%;
  height: v-bind(backgroundHeight);
  margin-top: -65px;
  overflow: hidden;
}

.blur-background.no-margin {
  margin-top: 0;
}

.blur-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.blur-sky {
  position: absolute;
  inset: 0;
}

.blur-content {
  position: relative;
  z-index: 10;
  height: 100%;
}

/* ============================================
   HALO CONTAINER
   ============================================ */
.halo-container {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.halo {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  will-change: transform;
}

/* Halo positioning - starting positions for traversal */
.halo-1 {
  width: 65%;
  height: 65%;
  top: -10%;
  left: -65%;
  animation: traverse-1 linear infinite;
}

.halo-2 {
  width: 55%;
  height: 55%;
  top: 60%;
  left: 100%;
  animation: traverse-2 linear infinite;
}

.halo-3 {
  width: 75%;
  height: 75%;
  top: 100%;
  left: -20%;
  animation: traverse-3 linear infinite;
}

.halo-4 {
  width: 45%;
  height: 45%;
  top: -45%;
  left: 80%;
  animation: traverse-4 linear infinite;
}

.halo-5 {
  width: 40%;
  height: 40%;
  top: 30%;
  left: -40%;
  animation: traverse-5 linear infinite;
}

/* Glass overlay */
.blur-glass {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 30% 20%, rgba(255, 255, 255, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse at 70% 80%, rgba(6, 182, 212, 0.05) 0%, transparent 50%);
}

/* ============================================
   ANIMATIONS - Traversing across screen with fade in/out
   ============================================ */

/* Halo 1: Left to right, slight downward diagonal */
@keyframes traverse-1 {
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translate(200%, 40%) scale(1.1);
    opacity: 0;
  }
}

/* Halo 2: Right to left, upward diagonal */
@keyframes traverse-2 {
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translate(-220%, -80%) scale(0.9);
    opacity: 0;
  }
}

/* Halo 3: Bottom-left to top-right diagonal */
@keyframes traverse-3 {
  0% {
    transform: translate(0, 0) scale(1.1);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translate(140%, -180%) scale(0.95);
    opacity: 0;
  }
}

/* Halo 4: Top-right to bottom-left steep diagonal */
@keyframes traverse-4 {
  0% {
    transform: translate(0, 0) scale(0.9);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translate(-180%, 200%) scale(1.15);
    opacity: 0;
  }
}

/* Halo 5: Left to right, horizontal with slight wave */
@keyframes traverse-5 {
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 0;
  }
  10% {
    transform: translate(24%, -6%) scale(1.02);
    opacity: 1;
  }
  30% {
    transform: translate(72%, -15%) scale(1.05);
  }
  50% {
    transform: translate(120%, 10%) scale(0.95);
  }
  70% {
    transform: translate(168%, -10%) scale(1.08);
  }
  90% {
    transform: translate(216%, 3%) scale(1.02);
    opacity: 1;
  }
  100% {
    transform: translate(240%, 5%) scale(1);
    opacity: 0;
  }
}

/* ============================================
   RESPONSIVE
   ============================================ */

@media (max-width: 960px) {
  .halo {
    filter: blur(60px);
  }
}

@media (max-width: 600px) {
  .halo {
    filter: blur(50px);
  }

  .halo-5 {
    display: none;
  }
}

/* Reduce motion for accessibility */
@media (prefers-reduced-motion: reduce) {
  .halo {
    animation: none;
  }
}
</style>
