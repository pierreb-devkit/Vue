<!--
  HomeArticlesComponent
  =====================
  Carousel of image cards, typically used for blog posts or articles.

  USAGE:
  <homeArticlesComponent :setup="{ content: news, ...config.home.articles }" />

  CONFIG EXAMPLE (setup object):
  articles: {
    title: 'Latest Articles',
    url: 'https://blog.example.com',
    key: '',                         // set via DEVKIT_VUE_home_articles_key env var
    slide: {
      interval: 15000,              // Auto-slide interval in ms
    },
    style: {
      section: { background: 'background' },
    },
  }

  CONTENT FORMAT (from Ghost API or custom):
  content: [
    {
      title: 'Article Title',
      excerpt: 'Short description...',
      feature_image: '/images/blog01.webp',
      url: 'https://blog.example.com/post',
    },
  ]
-->
<template>
  <section id="articles" :style="sectionStyle">
    <v-container ref="imagesContainer" :style="containerStyle">
      <v-row align="center" justify="center" class="px-0 py-8">
        <v-col cols="12">
          <homeContentComponent :setup="setup"></homeContentComponent>
        </v-col>
        <v-carousel
          v-if="setup.content.length > 0"
          v-model="step"
          cycle
          height="100%"
          hide-delimiter-background
          hide-delimiters
          :show-arrows="false"
          :interval="setup.slide.interval || 6000"
          :class="`${config.vuetify.theme.rounded}`"
        >
          <v-carousel-item v-for="n in steps + 1" :key="n">
            <v-row align="center" justify="center" class="pa-0">
              <v-col v-for="(item, i) in content" :key="i" cols="12" :md="item.fullWidth ? 12 : setup.content.length > 1 ? 6 : 12">
                <v-hover v-slot="{ isHovering, props }">
                  <!-- eslint-disable-next-line -->
                  <a :href="safeHref(item.url)" target="_blank" rel="noopener noreferrer">
                    <homeImgComponent
                      v-if="item.feature_image"
                      v-bind="props"
                      class="img-comp mb-4 align-end"
                      :class="{ 'on-hover': isHovering }"
                      :img="item.feature_image"
                      gradient="to bottom, rgba(0,0,0,.1), rgba(0,0,0,.7)"
                      :title="item.title"
                      :text="item.excerpt"
                      :height="$vuetify.display.xsAndDown ? '275px' : $vuetify.display.smAndDown ? '350px' : '500px'"
                    ></homeImgComponent>
                  </a>
                </v-hover>
              </v-col>
            </v-row>
          </v-carousel-item>
        </v-carousel>
        <homeDynamicIsland :container="imagesContainer" :step="step" :steps="steps" :action="stepper"></homeDynamicIsland>
      </v-row>
    </v-container>
  </section>
</template>

<script>
/**
 * Module dependencies.
 */
import { useTheme } from 'vuetify';
import { style, overlapStyle, colorModeStyle } from '../../../lib/helpers/theme';
import homeContentComponent from './utils/home.content.component.vue';
import homeImgComponent from './utils/home.img.component.vue';
import homeDynamicIsland from './utils/home.dynamicIsland.component.vue';

/**
 * Export default
 */
export default {
  name: 'HomeArticlesComponent',
  components: {
    homeContentComponent,
    homeImgComponent,
    homeDynamicIsland,
  },
  props: {
    setup: {
      type: Object,
      default: () => ({ data: [] }),
    },
  },
  data() {
    const theme = useTheme();
    return {
      step: 0,
      imagesContainer: null,
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
    steps() {
      return this.$vuetify.display.smAndDown ? this.setup.content.length - 1 : Math.ceil(this.setup.content.length / 2) - 1;
    },
    content() {
      return this.$vuetify.display.smAndDown
        ? this.setup.content.slice(this.step, this.step + 1)
        : this.setup.content.slice(this.step * 2, this.step * 2 + 2);
    },
  },
  mounted() {
    this.$nextTick(() => {
      this.imagesContainer = this.$refs.imagesContainer;
    });
  },
  methods: {
    style,
    stepper(input) {
      this.step = input;
    },
    /**
     * @desc Sanitize an external article URL before binding it to an anchor href.
     * Only http:/https: schemes are allowed; anything else (javascript:, data:,
     * unparseable values) collapses to '#' so a hostile feed entry cannot inject
     * a script-executing URL.
     * @param {string} url - The candidate article URL from the content feed.
     * @returns {string} The original URL when safe, otherwise '#'.
     */
    safeHref(url) {
      try {
        const { protocol } = new URL(url);
        return protocol === 'http:' || protocol === 'https:' ? url : '#';
      } catch {
        return '#';
      }
    },
  },
};
</script>

<style scoped>
.img-comp,
.v-card-text {
  transition: opacity 0.4s ease-in-out;
}

.img-comp:not(.on-hover) {
  opacity: 0.8;
}

.v-card-text {
  opacity: 0.7;
}
.v-card-text.on-hover {
  opacity: 1;
}
</style>
