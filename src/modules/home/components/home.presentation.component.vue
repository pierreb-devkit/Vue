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
  <section v-if="setup && setup.file" id="presentation" :style="styles.section" class="pa-8 pb-10">
    <v-container class="text-center" :max-width="config.vuetify.theme.maxWidth" :style="styles.container">
      <video-player
        :src="setup.file"
        :poster="setup.poster"
        :controls="false"
        :background-color="setup.style?.video?.background"
        :rounded="config.vuetify.theme.rounded"
        :playback-rate="setup.playbackRate || 1.0"
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
import { liquidGlassStyle, sectionStyles } from '../../../lib/helpers/theme';

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
    /**
     * Inline styles of the section, its container and its cards (theme helper).
     * @returns {{ section: Object, container: Object, card: Object, background: String }}
     */
    styles() {
      const styles = sectionStyles(this.setup, this.$vuetify?.display);
      return {
        ...styles,
        container: { ...styles.container, padding: '12px', ...liquidGlassStyle({ vuetifyTheme: this.theme, opacity: 0.25, variant: 'card' }) },
      };
    },
    variant() {
      return this.setup.variant || 'default';
    },
  },
};
</script>
