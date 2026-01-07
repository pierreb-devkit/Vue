<template>
  <div class="video-player">
    <video ref="videoElement" class="video-js"></video>
  </div>
</template>

<script>
/**
 * Module dependencies.
 */
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

/**
 * Component definition.
 */
export default {
  name: 'VideoPlayer',
  props: {
    src: {
      type: String,
      required: true,
    },
    poster: {
      type: String,
      default: '',
    },
    controls: {
      type: Boolean,
      default: true,
    },
    autoplay: {
      type: Boolean,
      default: false,
    },
    loop: {
      type: Boolean,
      default: false,
    },
    muted: {
      type: Boolean,
      default: false,
    },
    fluid: {
      type: Boolean,
      default: false,
    },
    responsive: {
      type: Boolean,
      default: false,
    },
    aspectRatio: {
      type: String,
      default: '16:9',
    },
    preload: {
      type: String,
      default: 'auto',
      validator: (value) => ['auto', 'metadata', 'none'].includes(value),
    },
    playbackRates: {
      type: Array,
      default: () => [0.5, 1, 1.5, 2],
    },
  },
  emits: [
    'ready',
    'play',
    'pause',
    'ended',
    'loadeddata',
    'waiting',
    'playing',
    'canplay',
    'canplaythrough',
    'error',
    'timeupdate',
    'volumechange',
    'durationchange',
    'progress',
  ],
  data() {
    return {
      player: null,
    };
  },
  watch: {
    src(newSrc) {
      if (this.player) {
        this.player.src({ src: newSrc, type: this.getVideoType(newSrc) });
      }
    },
  },
  mounted() {
    this.initPlayer();
  },
  beforeUnmount() {
    if (this.player) {
      this.player.dispose();
    }
  },
  methods: {
    initPlayer() {
      const options = {
        controls: this.controls,
        autoplay: this.autoplay,
        loop: this.loop,
        muted: this.muted,
        fluid: this.fluid,
        responsive: this.responsive,
        aspectRatio: this.aspectRatio,
        preload: this.preload,
        playbackRates: this.playbackRates,
        poster: this.poster,
        sources: [
          {
            src: this.src,
            type: this.getVideoType(this.src),
          },
        ],
      };

      this.player = videojs(this.$refs.videoElement, options, () => {
        this.$emit('ready', this.player);
      });

      // Forward Video.js events to Vue
      const events = [
        'play',
        'pause',
        'ended',
        'loadeddata',
        'waiting',
        'playing',
        'canplay',
        'canplaythrough',
        'error',
        'timeupdate',
        'volumechange',
        'durationchange',
        'progress',
      ];

      events.forEach((event) => {
        this.player.on(event, () => {
          this.$emit(event, this.player);
        });
      });
    },
    getVideoType(url) {
      const extension = url.split('.').pop().split('?')[0].toLowerCase();
      const mimeTypes = {
        mp4: 'video/mp4',
        webm: 'video/webm',
        ogg: 'video/ogg',
        ogv: 'video/ogg',
        mov: 'video/mp4',
        m3u8: 'application/x-mpegURL',
        mpd: 'application/dash+xml',
      };
      return mimeTypes[extension] || 'video/mp4';
    },
  },
};
</script>

<style scoped>
.video-player {
  width: 100%;
  background: transparent;
}

.video-player :deep(.video-js) {
  background-color: transparent;
}
</style>
