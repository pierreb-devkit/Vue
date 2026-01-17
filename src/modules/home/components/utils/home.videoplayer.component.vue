<!--
  VideoPlayer
  ===========
  Video.js wrapper component for playing videos with full customization.

  USAGE:
  <video-player
    :src="'/videos/demo.mp4'"
    :poster="'/videos/demo-poster.webp'"
    :controls="false"
    :autoplay="true"
    :loop="true"
    :muted="true"
    :fluid="true"
  />

  PROPS:
  - src (String, required): Video source URL
  - poster (String): Poster image URL
  - controls (Boolean): Show video controls (default: true)
  - autoplay (Boolean): Auto-play video (default: false)
  - loop (Boolean): Loop video (default: false)
  - muted (Boolean): Mute video (default: false)
  - fluid (Boolean): Responsive width (default: false)
  - responsive (Boolean): Responsive sizing (default: false)
  - aspectRatio (String): Aspect ratio (default: '16:9')
  - preload (String): Preload mode - 'auto', 'metadata', 'none' (default: 'auto')
  - playbackRate (Number): Initial playback speed (default: 1)

  NOTES:
  - Uses Video.js library
  - For autoplay to work on most browsers, muted must be true
-->
<template>
  <div class="video-player" :style="{ background: backgroundColor, borderRadius: borderRadius }">
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
    backgroundColor: {
      type: String,
      default: '#101115',
    },
    rounded: {
      type: String,
      default: 'rounded-lg',
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
    playbackRate: {
      type: Number,
      default: 1,
      validator: (value) => value > 0 && value <= 4,
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
  computed: {
    borderRadius() {
      const roundedMap = {
        'rounded-0': '0px',
        'rounded-sm': '2px',
        rounded: '4px',
        'rounded-lg': '8px',
        'rounded-xl': '24px',
        'rounded-pill': '9999px',
      };
      return roundedMap[this.rounded] || '16px';
    },
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
        // Set initial playback rate if provided
        if (this.playbackRate && this.playbackRate !== 1) {
          this.player.playbackRate(this.playbackRate);
        }
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
  overflow: hidden;
  padding: 4px;
}
</style>
