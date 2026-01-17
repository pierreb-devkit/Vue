<!--
  HomeVideoComponent
  ==================
  Auto-playing video section with liquid glass effect.

  USAGE:
  <homeVideoComponent :setup="config.home.video" />

  CONFIG EXAMPLE (setup object):
  video: {
    file: '/videos/highlight.mp4',
    poster: '/videos/highlight-poster.webp',
    style: {
      section: { background: 'background' },
      video: { background: '#101115' },
    },
  }

  NOTES:
  - Video auto-plays, loops, and is muted by default
  - To position under hero with overlap, set hero.overlap in config
-->
<template>
  <section v-if="setup && setup.file" id="presentation" :style="sectionStyle" class="pa-8 pb-10">
    <v-container class="text-center" :style="containerStyle">
      <video-player
        :src="setup.file"
        :poster="setup.poster"
        :controls="false"
        :background-color="setup.style?.video?.background || '#101115'"
        :rounded="config.vuetify.theme.rounded"
        loop
        muted
        autoplay
        fluid
      />
    </v-container>
  </section>
</template>

<script>
/**
 * Module dependencies.
 */
import { useTheme } from 'vuetify';
import VideoPlayer from './utils/home.videoplayer.component.vue';
import { style, liquidGlassStyle, overlapStyle } from '../../../lib/helpers/theme';

/**
 * Component definition.
 */
export default {
  name: 'HomePresentationComponent',
  components: {
    VideoPlayer,
  },
  props: {
    // video object
    setup: {
      type: Object,
      default: () => ({
        file: 'video.mp4',
        poster: 'video-poster.webp',
        background: '#101115',
      }),
    },
  },
  data() {
    const theme = useTheme();
    return {
      theme,
    };
  },
  computed: {
    variant() {
      return this.setup.variant || 'default';
    },
    sectionStyle() {
      const bgColor = this.variant === 'alternate' ? this.theme.current.colors.surface : this.theme.current.colors.background;
      return {
        ...style('section', this.setup),
        background: bgColor,
      };
    },
    containerStyle() {
      return {
        'max-width': this.config.vuetify.theme.maxWidth,
        ...overlapStyle(this.setup.overlap, this.$vuetify?.display),
        padding: '12px',
        ...liquidGlassStyle({ vuetifyTheme: this.theme }),
      };
    },
  },
  methods: {
    style,
  },
};
</script>
