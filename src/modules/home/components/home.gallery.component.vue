<!--
  HomeSlideshowComponent
  ======================
  Full-width image slideshow with optional text overlay and tabs.

  USAGE:
  <homeSlideshowComponent :setup="config.home.designs" />

  CONFIG EXAMPLE (setup object):
  designs: {
    subBanner: false,              // Position under banner with overlap
    style: {
      section: { background: 'background' },
    },
    slide: {
      height: '600px',             // Carousel height
      interval: 6000,              // Auto-slide interval in ms
      showTitle: false,            // Show tabs with titles
      titleColor: 'primary',       // Tab text color
    },
    content: [
      {
        img: {
          src: '/images/slide01.webp',
          gradient: 'to right, rgba(0,0,0,.5), transparent',
          height: 400,             // Sub-image height
        },
        subtitle: 'Slide Title',
        text: 'Description text',
        subimg: '/images/subimage.webp',
        reversed: false,           // Subimage position (left/right)
      },
    ],
  }
-->
<template>
  <section id="gallery" :style="sectionStyle">
    <v-container
      ref="slideShowContainer"
      :style="{
        'max-width': config.vuetify.theme.maxWidth,
        'margin-top': setup.subBanner ? ($vuetify.display.smAndDown ? '-20vh' : '-40vh') : 0,
        position: 'relative',
      }"
    >
      <v-row align="center" justify="center" class="px-0 py-8">
        <v-col cols="12">
          <homeContentComponent :setup="setup"></homeContentComponent>
        </v-col>
        <v-col cols="12">
          <v-tabs v-if="setup.slide.showTitle" v-model="step" class="mb-4" :style="style('tabs', setup)">
            <v-tab
              v-for="({ title }, i) in setup.content"
              :key="i"
              :value="i"
              :color="setup.slide.titleColor"
              :class="`${config.vuetify.theme.rounded}`"
              hide-slider
              mobile-breakpoint=""
            >
              <span class="text-capitalize text-h6 text-md-h5 font-weight-bold"> {{ title }}</span>
            </v-tab>
          </v-tabs>
          <v-carousel
            v-if="setup.content.length > 0"
            v-model="step"
            cycle
            :height="$vuetify.display.smAndDown ? (setup.slide.height * 2) / 3 : setup.slide.height"
            hide-delimiter-background
            hide-delimiters
            :show-arrows="false"
            :interval="setup.slide.interval || 6000"
            :class="`${config.vuetify.theme.rounded}`"
          >
            <v-carousel-item v-for="({ img, subtitle, subimg, text, reversed }, i) in setup.content" :key="i" :src="img.src" cover>
              <v-container
                class="fill-height"
                :style="{ 'max-width': config.vuetify.theme.maxWidth, ...style('carousel', setup), background: img.gradient }"
              >
                <v-row align="center" justify="center">
                  <v-col v-if="subimg && reversed" class="px-10" cols="12" sm="12" md="6">
                    <homeImgComponent
                      v-if="subimg"
                      :height="$vuetify.display.smAndDown ? img.height / 3 : img.height"
                      :img="subimg"
                    ></homeImgComponent>
                  </v-col>
                  <v-col class="text-left px-10" cols="12" sm="12" md="6">
                    <h4 v-if="subtitle" class="text-h5 text-md-h3 font-weight-bold mb-8">{{ subtitle }}</h4>
                    <VMarkdown v-if="text" :source="text" class="text-h6 text-md-h4" />
                  </v-col>
                  <v-col v-if="subimg && !reversed" class="px-10" cols="12" sm="12" md="6">
                    <homeImgComponent
                      v-if="subimg"
                      :height="$vuetify.display.smAndDown ? img.height / 3 : img.height"
                      :img="subimg"
                    ></homeImgComponent>
                  </v-col>
                </v-row>
              </v-container>
            </v-carousel-item>
          </v-carousel>
        </v-col>

        <homeDynamicIsland v-if="steps > 0" :container="slideShowContainer" :step="step" :steps="steps" :action="stepper"></homeDynamicIsland>
      </v-row>
    </v-container>
  </section>
</template>

<script>
/**
 * Module dependencies.
 */
import { useTheme } from 'vuetify';
import { style } from '../../../lib/helpers/theme';
import homeContentComponent from './utils/home.content.component.vue';
import homeDynamicIsland from './utils/home.dynamicIsland.component.vue';
import homeImgComponent from './utils/home.img.component.vue';

/**
 * Export default
 */
export default {
  name: 'HomeGalleryComponent',
  components: {
    homeContentComponent,
    homeDynamicIsland,
    homeImgComponent,
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
      slideShowContainer: null,
      theme,
    };
  },
  computed: {
    variant() {
      return this.setup.variant || 'default';
    },
    sectionStyle() {
      if (!this.theme?.current?.colors) return style('section', this.setup);
      const bgColor = this.variant === 'alternate' ? this.theme.current.colors.surface : this.theme.current.colors.background;
      return {
        ...style('section', this.setup),
        background: bgColor,
      };
    },
    steps() {
      return this.setup.content.length - 1;
    },
  },
  mounted() {
    this.$nextTick(() => {
      this.slideShowContainer = this.$refs.slideShowContainer;
    });
  },
  methods: {
    style,
    stepper(input) {
      this.step = input;
    },
  },
};
</script>
