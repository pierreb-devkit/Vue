<template>
  <section v-if="setup && setup.file" id="video" :style="style('section', setup)" class="pa-8 pb-10">
    <v-container
      :class="`text-center pa-4 ${config.vuetify.theme.rounded}`"
      :style="{
        'max-width': config.vuetify.theme.maxWidth,
        'margin-top': setup.subBanner ? ($vuetify.display.smAndDown ? '-20vh' : '-40vh') : 0,
        position: 'relative',
        ...style('video', setup),
      }"
    >
      <video-player :src="setup.file" :poster="setup.poster" :controls="false" loop muted autoplay fluid />
    </v-container>
  </section>
</template>

<script>
/**
 * Module dependencies.
 */
import VideoPlayer from './utils/home.videoplayer.component.vue';
import { style } from '../../../lib/helpers/theme';

/**
 * Component definition.
 */
export default {
  name: 'HomeAboutsComponent',
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
  methods: {
    style,
  },
};
</script>
