<template>
  <section id="banner">
    <v-img
      :height="ratio ? `calc(${100 / ratio}vh)` : $vuetify.display.smAndDown ? '70vh' : '90vh'"
      :src="banner ? banner : generateBackground()"
      style="margin-top: -65px"
      max-width="100%"
      cover
      alt="banner"
    >
      <v-container class="fill-height">
        <v-row align="center" justify="center">
          <v-col
            class="text-white text-center"
            :style="{
              'margin-top': ratio ? '5vh' : $vuetify.display.smAndDown ? '-5vh' : '-25vh',
            }"
          >
            <div class="mb-5"><VMarkdown v-if="title" class="font-weight-bold text-h4 text-md-h2" :source="title" /></div>
            <div class="mb-10"><VMarkdown v-if="subtitle" class="font-weight-medium text-body-1 text-md-h6" :source="subtitle" /></div>
            <v-btn
              v-if="button && button.title"
              :href="button.link"
              class="text-none font-weight-bold rounded-xl"
              :style="{ 'border-color': button.color, 'border-width': '1.5px' }"
              variant="outlined"
              size="large"
              >{{ button.title }}</v-btn
            >
          </v-col>
        </v-row>
      </v-container>
    </v-img>
  </section>
</template>

<script>
/**
 * Component definition.
 */
export default {
  name: 'HomeBannerComponent',
  props: {
    // title to display
    banner: {
      type: String,
      default: null,
    },
    // define a ratio to handle banne height
    ratio: {
      type: [Number, String],
      default: null,
    },
    // title to display
    title: {
      type: String,
      default: null,
    },
    // subtitle to display
    subtitle: {
      type: String,
      default: null,
    },
    // button to display
    button: {
      type: Object,
      default: () => ({}),
    },
  },
  methods: {
    generateBackground() {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return this.config.home.darkBackground;
      }
      return this.config.home.lightBackground;
    },
  },
};
</script>
