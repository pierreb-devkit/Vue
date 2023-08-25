<!--
  - Call example
    <homeSlideshowComponent
      v-bind:slides="slideshow"
      v-bind:custom="{ section: { background: config.vuetify.theme.themes[theme].colors.surface } }"
      v-bind:height="pageHeight / 1.75"
      v-bind:full="true"
      v-bind:interval="10000"
      v-bind:mdImage="null"
      v-bind:mdText="null"
    ></homeSlideshowComponent>
  - Data Example
    slideshow: {
      title: 'Demos',
      data: [
        {
          img: '01.jpg',
          icon: null,
          title: null,
          text: null,
        },
        {
          img: '02.jpg',
          icon: null,
          title: null,
          text: null,
        },
      ],
    },
-->
<template>
  <section id="slideShow" :class="full ? '' : 'py-12'" :style="custom && custom.section ? custom.section : null" v-if="slides.data.length > 0">
    <!-- slideshow full -->
    <v-carousel
      v-if="full"
      cycle
      :height="height"
      hide-delimiter-background
      :show-arrows="false"
      :interval="interval || 6000"
      style="max-height: 900px !important"
    >
      <v-carousel-item
        v-for="({ img, text, dark, color, position }, i) in slides.data"
        :key="i"
        :src="dark ? `${img.split('.')[0]}-${theme}.${img.split('.')[1]}` : img"
        cover
      >
        <v-sheet color="transparent" height="100%">
          <div class="d-flex fill-height justify-center align-center" :style="{ float: position && !$vuetify.display.smAndDown ? position : 'none' }">
            <div
              class="text-h3"
              :style="{
                color: color || config.vuetify.theme.themes[theme].colors.onPrimary,
                margin: '50px',
              }"
            >
              {{ text }}
            </div>
          </div>
        </v-sheet>
      </v-carousel-item>
    </v-carousel>
    <!-- slideshow with text -->
    <v-container v-else class="text-center">
      <h2
        class="font-weight-bold mb-3 pb-8 text-h4 text-center"
        style="text-transform: uppercase !important"
        v-if="slides.title"
        v-text="slides.title"
      ></h2>
      <v-carousel
        cycle
        :height="height + 100"
        hide-delimiter-background
        :light="this.theme === 'light' ? true : false"
        :show-arrows="false"
        :interval="interval || 6000"
      >
        <v-carousel-item v-for="({ img, icon, title, text, dark, color }, i) in slides.data" :key="i">
          <v-sheet color="transparent" height="100%">
            <v-row justify="center" align="center" class="fill-height">
              <v-col cols="12" :md="mdImage || 6">
                <v-img :src="dark ? `${img.split('.')[0]}-${theme}.${img.split('.')[1]}` : img" class="mb-4" :height="height"></v-img>
              </v-col>
              <v-col v-if="title || text || icon" cols="12" :md="mdText || 6">
                <v-card class="py-12 px-4" :flat="config.vuetify.theme.flat" color="rgb(255, 255, 255, 0)">
                  <div>
                    <v-avatar v-if="icon" color="primary" size="88">
                      <v-icon dark large data-aos="fade-up">{{ icon }}</v-icon>
                    </v-avatar>
                  </div>
                  <v-card-title
                    v-if="title"
                    class="justify-center font-weight-black text-uppercase"
                    :style="{
                      color: color || config.vuetify.theme.themes[theme].colors.onBackground,
                    }"
                    >{{ title }}</v-card-title
                  >
                  <v-card-text v-if="text" class="subtitle-1 text-medium-emphasis text-onSurface">
                    <v-markdown :source="text" />
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
/**
 * Export default
 */
export default {
  name: 'homeSlideshowComponent',
  props: ['slides', 'custom', 'height', 'mdImage', 'mdText', 'full', 'interval'],
  computed: {
    ...mapGetters(['theme']),
  },
};
</script>
