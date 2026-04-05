<!--
  HomeContentComponent
  ====================
  Content section with text, images, and optional video. Supports multiple columns.

  USAGE:
  <homeContentComponent :setup="config.home.features" />

  CONFIG EXAMPLE (setup object):
  features: {
    title: 'Features',
    style: {
      section: { background: 'background' },
      video: { background: '#101115' },
    },
    content: [
      {
        subtitle: 'Feature Title',
        text: 'Description with **markdown** support.',
        img: '/images/feature.webp',          // Static image
        imgBackground: '#f5f5f7',             // Wraps image in rounded card with bg color
        // imgBackground: { light: '#f5f5f7', dark: '#1e293b' }  // Theme-aware variant
        video: {                               // Or video
          file: '/videos/demo.mp4',
          poster: '/videos/demo-poster.webp',
        },
        reversed: false,       // Text position (false = after media, true = before)
        fullWidth: true,       // Full width content
        button: {
          title: 'Learn More',
          link: '/features',
        },
      },
    ],
  }
-->
<template>
  <section id="about" :style="sectionStyle">
    <v-container :style="containerStyle">
      <v-row v-if="setup.content.length > 0" align="center" justify="center" class="px-0 py-8">
        <v-col cols="12">
          <homeContentComponent :setup="setup"></homeContentComponent>
        </v-col>
        <v-col v-for="(item, i) in setup.content" :key="i" :md="item.fullWidth ? 12 : setup.content.length > 1 ? 6 : 12" cols="12">
          <homeContentComponent v-if="item.reversed" :setup="item" class="mb-6"></homeContentComponent>
          <div v-if="item.video" :class="`py-6`">
            <video-player
              :src="item.video.file"
              :controls="false"
              :poster="item.video.poster"
              :background-color="item.video.background || setup.style?.video?.background || '#101115'"
              :rounded="config.vuetify.theme.rounded"
              :playback-rate="item.video.playbackRate || 1.0"
              loop
              muted
              autoplay
              fluid
            />
          </div>
          <div
            v-if="item.img && resolveImgBackground(item)"
            :style="{ backgroundColor: resolveImgBackground(item), borderRadius: config.vuetify.theme.rounded === 'rounded-xl' ? '16px' : '8px' }"
            class="my-6 pa-6 d-flex align-center justify-center"
          >
            <v-img
              :src="item.img"
              :height="$vuetify.display.xsAndDown ? '250px' : $vuetify.display.smAndDown ? '325px' : '375px'"
              :class="config.vuetify.theme.rounded"
              contain
              :alt="item.subtitle || item.title || 'content'"
            ></v-img>
          </div>
          <v-img
            v-else-if="item.img"
            :src="item.img"
            :height="$vuetify.display.xsAndDown ? '250px' : $vuetify.display.smAndDown ? '325px' : '375px'"
            :class="`my-6 ${config.vuetify.theme.rounded}`"
            cover
            :alt="item.subtitle || item.title || 'content'"
          ></v-img>
          <homeContentComponent v-if="!item.reversed" :setup="item"></homeContentComponent>
        </v-col>
      </v-row>
    </v-container>
  </section>
</template>

<script>
/**
 * Module dependencies.
 */
import { useTheme } from 'vuetify';
import VideoPlayer from './utils/home.videoplayer.component.vue';
import { style, overlapStyle, colorModeStyle } from '../../../lib/helpers/theme';
import homeContentComponent from './utils/home.content.component.vue';

/**
 * Component definition.
 */
export default {
  name: 'HomeAboutComponent',
  components: {
    VideoPlayer,
    homeContentComponent,
  },
  props: {
    setup: {
      type: Object,
      default: () => {},
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
    containerStyle() {
      return {
        'max-width': this.config.vuetify.theme.maxWidth,
        ...overlapStyle(this.setup.overlap, this.$vuetify?.display),
      };
    },
    sectionStyle() {
      const hasCustomBg = this.setup?.style?.section?.background;
      const bgColor = this.variant === 'alternate' ? this.theme.current.colors.surface : this.theme.current.colors.background;
      return {
        ...style('section', this.setup),
        ...colorModeStyle(this.setup.colorMode),
        ...(hasCustomBg ? {} : { background: bgColor }),
      };
    },
  },
  methods: {
    style,
    resolveImgBackground(item) {
      const bg = item.imgBackground;
      if (!bg) return null;
      if (typeof bg === 'string') return bg;
      if (typeof bg === 'object' && bg.light && bg.dark) {
        return this.theme.name === 'dark' ? bg.dark : bg.light;
      }
      return null;
    },
  },
};
</script>
