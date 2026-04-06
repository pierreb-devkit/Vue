<!--
  HomeImgComponent
  ================
  Responsive image component with lazy loading, gradient overlay, and optional text.
  SVGs are rendered inline so they can access CSS custom properties (e.g. Vuetify theme vars).

  USAGE:
  <homeImgComponent
    :img="'/images/photo.webp'"
    :height="'350px'"
    :gradient="'to bottom, rgba(0,0,0,.1), rgba(0,0,0,.7)'"
    :title="'Image Title'"
    :text="'Description text'"
  />

  PROPS:
  - img (String, required): Image source URL
  - height (String|Number): Custom height (default: responsive 225-350px); numbers get 'px' appended
  - gradient (String): CSS gradient overlay (applied in both SVG and raster paths)
  - title (String): Title text displayed on image
  - text (String): Description text displayed on image
  - alt (String): Alt text for accessibility (falls back to title, then empty string for decorative images)
  - imgMode (String): Image fit mode — 'cover' (default) or 'contain' for SVG illustrations

  NOTES:
  - Uses lazy-src for placeholder during loading
  - Displays loading spinner while image loads
  - Applies theme rounded corners automatically
  - Only relative/local SVG URLs are inlined; absolute URLs use standard <v-img>
  - SVG content is sanitized (scripts, event handlers, foreignObject removed) before rendering
-->
<template>
  <!-- Inline SVG: rendered via v-html so it can access CSS custom properties -->
  <div
    v-if="isSvg"
    :class="['home-img-svg', config.vuetify.theme.rounded]"
    :style="{ height: cssHeight }"
    :aria-label="alt || title || undefined"
    :aria-hidden="alt || title ? undefined : 'true'"
    role="img"
  >
    <!-- eslint-disable-next-line vue/no-v-html -- sanitized SVG from a relative/local source only -->
    <div v-if="svgContent" class="home-img-svg__content" v-html="sanitizedSvg"></div>
    <div v-else-if="svgError" class="d-flex align-center justify-center fill-height">
      <v-icon color="grey-lighten-2" size="48">mdi-image-off-outline</v-icon>
    </div>
    <div v-else class="d-flex align-center justify-center fill-height">
      <v-progress-circular color="grey-lighten-4" indeterminate></v-progress-circular>
    </div>
    <div
      v-if="gradient"
      class="home-img-svg__gradient"
      :style="{ backgroundImage: `linear-gradient(${gradient})` }"
    ></div>
    <div v-if="title || text" class="home-img-svg__overlay d-flex flex-column justify-space-between fill-height">
      <v-card-title v-if="title" class="px-10 text-white text-headline-small font-weight-bold">
        {{ title }}
      </v-card-title>
      <v-card-text v-if="text" class="px-10 text-white text-body-large pb-5">
        {{ text }}
      </v-card-text>
    </div>
  </div>

  <!-- Raster / non-SVG: standard v-img with lazy loading -->
  <v-img
    v-else
    :src="img"
    lazy-src="/images/lazy.webp"
    :class="`${config.vuetify.theme.rounded}`"
    :height="cssHeight"
    :gradient="gradient"
    :cover="imgMode !== 'contain'"
    :style="imgMode === 'contain' ? 'object-fit: contain' : ''"
    :alt="alt || title || ''"
  >
    <template #placeholder>
      <div class="d-flex align-center justify-center fill-height">
        <v-progress-circular color="grey-lighten-4" indeterminate></v-progress-circular>
      </div>
    </template>
    <v-card-title v-if="title" class="px-10 text-white text-headline-small font-weight-bold"> {{ title }}</v-card-title>
    <v-card-text v-if="text" class="px-10 text-white text-body-large pb-5"> {{ text }}</v-card-text>
  </v-img>
</template>
<script>
import DOMPurify from 'dompurify';

/**
 * Simple in-memory cache for fetched SVG content to avoid duplicate requests.
 * @type {Map<string, string>}
 */
const svgCache = new Map();

/**
 * Regex to detect relative/local URLs (starts with / but not //, or ./ or ../).
 * @type {RegExp}
 */
const LOCAL_URL_RE = /^(?:\/(?!\/)|\.{1,2}\/)/;

/**
 * Sanitize raw SVG markup using DOMPurify to remove dangerous elements and attributes.
 * @param {string} raw - Raw SVG markup string.
 * @returns {string} Sanitized SVG markup safe for v-html rendering.
 */
const sanitizeSvg = (raw) => DOMPurify.sanitize(raw, {
  USE_PROFILES: { svg: true, svgFilters: true },
  FORBID_TAGS: ['script', 'use'],
  FORBID_ATTR: ['onload', 'onerror'],
});

/**
 * Component definition.
 */
export default {
  name: 'HomeImgComponent',
  props: {
    img: {
      type: String,
      required: true,
    },
    gradient: {
      type: String,
      default: '',
    },
    title: {
      type: String,
      default: '',
    },
    text: {
      type: String,
      default: '',
    },
    height: {
      type: [String, Number],
      default: '',
    },
    /**
     * Alt text for the image, used for accessibility and SEO.
     * @type {string}
     */
    alt: {
      type: String,
      default: '',
    },
    /**
     * Image fit mode: 'cover' (default) fills the area, 'contain' fits the
     * entire image inside (useful for SVG illustrations).
     * @type {string}
     */
    imgMode: {
      type: String,
      default: 'cover',
    },
  },
  data() {
    return {
      svgContent: '',
      svgError: false,
    };
  },
  computed: {
    /**
     * Whether the image source is an SVG file that should be inlined.
     * Only relative/local URLs are inlined; absolute URLs fall back to v-img.
     * @returns {boolean} True when the source is a local SVG.
     */
    isSvg() {
      return this.img && this.img.toLowerCase().endsWith('.svg') && LOCAL_URL_RE.test(this.img);
    },
    /**
     * Responsive height matching original v-img behaviour.
     * @returns {string|number} Height value (may be a number from props).
     */
    computedHeight() {
      if (this.height) return this.height;
      if (this.$vuetify.display.xsAndDown) return '225px';
      if (this.$vuetify.display.smAndDown) return '300px';
      return '350px';
    },
    /**
     * Normalize height to a valid CSS value (append 'px' to bare numbers).
     * @returns {string} CSS-ready height string.
     */
    cssHeight() {
      const h = this.computedHeight;
      return typeof h === 'number' ? `${h}px` : h;
    },
    /**
     * Sanitized SVG markup safe for v-html rendering.
     * @returns {string} Cleaned SVG content.
     */
    sanitizedSvg() {
      return this.svgContent ? sanitizeSvg(this.svgContent) : '';
    },
  },
  watch: {
    img: {
      immediate: true,
      handler: 'fetchSvg',
    },
  },
  methods: {
    /**
     * Fetch the SVG source and store its markup for inline rendering.
     * Results are cached so repeated mounts/navigations don't re-fetch.
     * Clears previous content before fetching to avoid stale renders.
     * @returns {Promise<void>} Resolves when SVG loading and caching handling is complete.
     */
    async fetchSvg() {
      if (!this.isSvg) return;
      const src = this.img;

      // Clear previous content to avoid showing stale SVG during fetch.
      this.svgContent = '';
      this.svgError = false;

      if (svgCache.has(src)) {
        // Wait for the DOM to process the clear (svgContent = '') before reinserting.
        // Without nextTick, Vue batches both assignments in the same tick — no real
        // DOM clear happens, so the SVG elements are never fresh-inserted and CSS
        // opacity animations don't replay on subsequent views.
        await this.$nextTick();
        if (this.img === src) this.svgContent = svgCache.get(src);
        return;
      }

      try {
        const res = await fetch(src);
        if (!res.ok) {
          if (this.img === src) this.svgError = true;
          return;
        }
        const text = await res.text();
        // Basic sanity check: only accept actual SVG markup.
        if (!text.includes('<svg')) {
          if (this.img === src) this.svgError = true;
          return;
        }
        svgCache.set(src, text);
        // Guard against race condition if img changed while fetching.
        if (this.img === src) this.svgContent = text;
      } catch {
        // Show error state instead of infinite spinner.
        if (this.img === src) this.svgError = true;
      }
    },
  },
};
</script>
<style scoped>
.home-img-svg {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.home-img-svg__content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Ensure the inline SVG scales to fit the container */
.home-img-svg__content :deep(svg) {
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
}

.home-img-svg__gradient {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
}

.home-img-svg__overlay {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
}
</style>
