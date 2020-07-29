<template>
  <section
    id="features"
    :class="full ? '': 'py-12'"
    :style="custom && custom.section ? custom.section : null"
    v-if="slides.data.length > 0"
  >
    <!-- slideshow full -->
    <v-carousel v-if="full" cycle :height="height" hide-delimiter-background :show-arrows="false" :interval="interval || 6000">
      <v-carousel-item v-for="({img, title}, i) in slides.data" :key="i">
        <v-sheet color="transparent" height="100%">
          <v-row class="fill-height" align="center" justify="center">
            <v-img :src="img" class="mb-4" height="100%" max-width="100%">
              <div class="pt-10 display-2 text-center">{{ title }}</div>
            </v-img>
          </v-row>
        </v-sheet>
      </v-carousel-item>
    </v-carousel>
    <!-- slideshow with text -->
    <v-container v-else class="text-center">
      <h2
        class="display-1 font-weight-bold mb-3 text-uppercase"
        v-if="slides.title"
      >{{ slides.title }}</h2>
      <v-carousel cycle :height="height + 100" hide-delimiter-background :light='this.theme === "light" ? true : false' :show-arrows="false" :interval="interval || 6000">
        <v-carousel-item v-for="({ img, icon, title, text }, i) in slides.data" :key="i">
          <v-sheet color="transparent" height="100%">
            <v-row justify="center" align="center" class="fill-height">
              <v-col cols="12" :md="mdImage || 6">
                <v-img :src="img" class="mb-4" :height="height" max-width="100%"></v-img>
              </v-col>
              <v-col v-if="title || text || icon" cols="12" :md="mdText || 6">
                <v-card
                  class="py-12 px-4"
                  :flat="config.vuetify.theme.flat"
                  color="rgb(255, 255, 255, 0)"
                >
                  <div>
                    <v-avatar v-if="icon" color="primary" size="88">
                      <v-icon dark large data-aos="fade-up">{{ icon }}</v-icon>
                    </v-avatar>
                  </div>
                  <v-card-title
                    v-if="title"
                    class="justify-center font-weight-black text-uppercase"
                    v-text="title"
                  ></v-card-title>
                  <v-card-text v-if="text" class="subtitle-1 text--secondary">
                    <vue-markdown :source="text" />
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-sheet>
        </v-carousel-item>
      </v-carousel>
    </v-container>
  </section>
</template>

<script>
/**
 * Module dependencies.
 */
import { mapGetters } from 'vuex';
import VueMarkdown from 'vue-markdown';
/**
 * Export default
 */
export default {
  name: 'homeSlideshowComponent',
  props: ['slides', 'custom', 'height', 'mdImage', 'mdText', 'full', 'interval'],
  computed: {
    ...mapGetters(['theme']),
  },
  components: {
    VueMarkdown,
  },
};
</script>
