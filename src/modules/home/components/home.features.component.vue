<!--
  HomeCardsComponent
  ==================
  Carousel of cards with image, text, and button. Supports sliding and styling.

  USAGE:
  <homeCardsComponent :setup="config.home.repos" />

  CONFIG EXAMPLE (setup object):
  repos: {
    title: 'Our Products',
    slide: {
      interval: 15000,  // Auto-slide interval in ms
    },
    style: {
      section: { background: 'surface' },
    },
    content: [
      {
        subtitle: 'Product Name',
        img: '/images/card01.webp',
        text: 'Description with **markdown** support.',
        reversed: false,       // Image position (false = top, true = bottom)
        fullWidth: false,      // Full width card
        button: {
          title: 'Learn More →',
          color: '#EA3F7D',
          link: 'https://example.com',
        },
        style: {
          card: {
            background: '#FFD0E4',
            color: '#000000',
          },
        },
      },
    ],
  }
-->
<template>
  <section id="features" :style="sectionStyle">
    <v-container ref="cardsContainer" :style="`max-width: ${config.vuetify.theme.maxWidth}`">
      <v-row align="center" justify="center" class="px-0 py-8">
        <v-col cols="12">
          <homeContentComponent :setup="setup" :alignment="setup.alignment || 'left'"></homeContentComponent>
        </v-col>
        <v-col cols="12">
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
                  <v-card :class="`${config.vuetify.theme.rounded}`" :flat="config.vuetify.theme.flat" :style="style('card', { style: item.style })">
                    <homeImgComponent v-if="item.img && !item.reversed" :img="item.img"></homeImgComponent>
                    <homeContentComponent
                      :setup="item"
                      :alignment="item.alignment || 'center'"
                      :color="item.color || 'default'"
                      variant="card"
                    ></homeContentComponent>
                    <homeImgComponent v-if="item.img && item.reversed" :img="item.img"></homeImgComponent>
                  </v-card>
                </v-col>
              </v-row>
            </v-carousel-item>
          </v-carousel>
        </v-col>
        <homeDynamicIsland v-if="steps > 0" :container="cardsContainer" :step="step" :steps="steps" :action="stepper"></homeDynamicIsland>
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
 * Component definition.
 */
export default {
  name: 'HomeFeaturesComponent',
  components: {
    homeContentComponent,
    homeDynamicIsland,
    homeImgComponent,
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
      step: 0,
      cardsContainer: null,
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
      this.cardsContainer = this.$refs.cardsContainer;
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
