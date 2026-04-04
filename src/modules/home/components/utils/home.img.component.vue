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
  - height (String): Custom height (default: responsive 225-350px)
  - gradient (String): CSS gradient overlay
  - title (String): Title text displayed on image
  - text (String): Description text displayed on image
  - alt (String): Alt text for accessibility (falls back to title, then empty string for decorative images)
  - imgMode (String): Image fit mode — 'cover' (default) or 'contain' for SVG illustrations

  NOTES:
  - Uses lazy-src for placeholder during loading
  - Displays loading spinner while image loads
  - Applies theme rounded corners automatically
  - SVG sources are fetched and rendered inline via v-html to inherit page CSS variables
-->
<template>
  <!-- Inline SVG: rendered via v-html so it can access CSS custom properties -->
  <div
    v-if="isSvg"
    :class="['home-img-svg', config.vuetify.theme.rounded]"
    :style="{ height: computedHeight }"
    :aria-label="alt || title || undefined"
    role="img"
  >
    <!-- eslint-disable-next-line vue/no-v-html -- trusted SVG fetched from our own origin -->
    <div v-if="svgContent" class="home-img-svg__content" v-html="svgContent"></div>
    <div v-else class="d-flex align-center justify-center fill-height">
      <v-progress-circular color="grey-lighten-4" indeterminate></v-progress-circular>
    </div>
    <v-card-title v-if="title" class="px-10 text-white text-headline-small font-weight-bold home-img-svg__overlay">
      {{ title }}
    </v-card-title>
    <v-card-text v-if="text" class="px-10 text-white text-body-large pb-5 home-img-svg__overlay">
      {{ text }}
    </v-card-text>
  </div>

  <!-- Raster / non-SVG: standard v-img with lazy loading -->
  <v-img
    v-else
    :src="img"
    lazy-src="/images/lazy.webp"
    :class="`${config.vuetify.theme.rounded}`"
    :height="computedHeight"
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
/**
 * Simple in-memory cache for fetched SVG content to avoid duplicate requests.
 * @type {Map<string, string>}
 */
const svgCache = new Map();

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
      type: String,
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
    };
  },
  computed: {
    /** Whether the image source is an SVG file. */
    isSvg() {
      return this.img && this.img.toLowerCase().endsWith('.svg');
    },
    /** Responsive height matching original v-img behaviour. */
    computedHeight() {
      if (this.height) return this.height;
      if (this.$vuetify.display.xsAndDown) return '225px';
      if (this.$vuetify.display.smAndDown) return '300px';
      return '350px';
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
     */
    async fetchSvg() {
      if (!this.isSvg) return;
      const src = this.img;

      if (svgCache.has(src)) {
        this.svgContent = svgCache.get(src);
        return;
      }

      try {
        const res = await fetch(src);
        if (!res.ok) return;
        const text = await res.text();
        // Basic sanity check: only accept actual SVG markup.
        if (!text.includes('<svg')) return;
        svgCache.set(src, text);
        // Guard against race condition if img changed while fetching.
        if (this.img === src) this.svgContent = text;
      } catch {
        // Silently fall back — the container stays empty / shows spinner.
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

.home-img-svg__overlay {
  position: absolute;
  left: 0;
  right: 0;
}
</style>
