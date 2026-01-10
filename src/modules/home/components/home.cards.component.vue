<template>
  <section id="cards" :style="style('section', setup)">
    <v-container ref="cardsContainer" :style="`max-width: ${config.vuetify.theme.maxWidth}`">
      <v-row align="center" justify="center" class="px-0 py-8">
        <homeTitleComponent :setup="setup"></homeTitleComponent>
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
                  <homeCardsTextComponent :item="item"></homeCardsTextComponent>
                  <homeImgComponent v-if="item.img && item.reversed" :img="item.img"></homeImgComponent>
                </v-card>
              </v-col>
            </v-row>
          </v-carousel-item>
        </v-carousel>
        <homeDynamicIsland v-if="steps > 0" :container="cardsContainer" :step="step" :steps="steps" :action="stepper"></homeDynamicIsland>
      </v-row>
    </v-container>
  </section>
</template>

<script>
/**
 * Module dependencies.
 */
import { style } from '../../../lib/helpers/theme';
import homeTitleComponent from './utils/home.title.component.vue';
import homeDynamicIsland from './utils/home.dynamicIsland.component.vue';
import homeCardsTextComponent from './utils/home.card.text.component.vue';
import homeImgComponent from './utils/home.img.component.vue';

/**
 * Component definition.
 */
export default {
  name: 'HomeCardsComponent',
  components: {
    homeTitleComponent,
    homeDynamicIsland,
    homeCardsTextComponent,
    homeImgComponent,
  },
  props: {
    setup: {
      type: Object,
      default: () => {},
    },
  },
  data: () => ({
    step: 0,
    cardsContainer: null,
  }),
  computed: {
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
