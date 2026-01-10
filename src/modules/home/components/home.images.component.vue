<template>
  <section id="images" :style="style('section', setup)">
    <v-container ref="imagesContainer" :style="`max-width: ${config.vuetify.theme.maxWidth}`">
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
                <v-hover v-slot="{ isHovering, props }">
                  <!-- eslint-disable-next-line -->
                  <a :href="item.url" target="_blank">
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
import { style } from '../../../lib/helpers/theme';
import homeTitleComponent from './utils/home.title.component.vue';
import homeImgComponent from './utils/home.img.component.vue';
import homeDynamicIsland from './utils/home.dynamicIsland.component.vue';

/**
 * Export default
 */
export default {
  name: 'HomeBlogComponent',
  components: {
    homeTitleComponent,
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
    return {
      step: 0,
      imagesContainer: null,
    };
  },
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
      this.imagesContainer = this.$refs.imagesContainer;
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
