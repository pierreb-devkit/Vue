<!--
  - Call example
    <homeBannerComponent
      v-bind:ratio="1"
      v-bind:app="app"
    ></homeBannerComponent>
  - Data Example
  app: {
    title: 'WAOS Dev',
    logo: 'logo.png', // null to use title by default
    subtitle: 'welcome to demo.',
    description: 'Vue - Boilerplate Front : Vuetify, Axios, Jest, Cypress (Alpha)'
    home: {
      blog: {
        subscribe: '...'
      }
    }
  },
-->
<template>
  <section id="hero">
    <v-row no-gutters>
      <v-img
        :height="'calc(100vh/' + ratio + ' - ' + 65 + 'px)'"
        :src="banner ? banner : config.home.temporalBackground ? generateTemporalBackground() : require('@/assets/images/background.jpg')"
        :gradient="banner ? 'rgba(0,0,0,.25), rgba(0,0,0,.25)' : ''"
        cover
      >
        <v-container class="fill-height">
          <v-row class="fill-height">
            <v-row align="center" justify="center">
              <v-col class="text-white text-center align-center" cols="12" tag="h1">
                <span v-if="app.title && !app.logo" class="font-weight-black text-md-h4 text-h5">{{ app.title }}</span>
                <v-img
                  v-if="app.logo"
                  :src="require('@/assets/images/' + this.config.app.logo)"
                  aspect-ratio="5"
                  max-width="375"
                  class="mb-2"
                  style="margin: auto"
                >
                </v-img>
                <span v-if="app.status && app.status !== ''" class="font-weight-light text-h5" style="opacity: 0.5">{{ app.status }}</span>
                <br />
                <br />
                <br v-if="!app.title && !app.logo" />
                <br v-if="!app.title && !app.logo" />
                <span v-if="app.subtitle" class="font-weight-light text-md-h4 text-h5">{{ app.subtitle }}</span>
              </v-col>
              <v-col class="text-white text-center" cols="12" v-if="ratio == 1">
                <v-btn @click="goToAboutMe()" color="transparent" elevation="0" icon data-aos="fade-up">
                  <v-icon>fa-solid fa-angle-down</v-icon>
                </v-btn>
              </v-col>
              <v-col
                class="text-white text-center"
                cols="11"
                xs="10"
                sm="9"
                md="7"
                lg="6"
                xl="5"
                style="bottom: 5%; position: absolute; opacity: 75%"
                v-if="config.home.blog && config.home.blog.subscribe && ratio == 1"
              >
                <v-btn :href="config.home.blog.subscribe" target="_blank" class="px-10" height="55" elevation="0" rounded light data-aos="fade-up"
                  ><span style="color: gray">Stay informed by email<v-icon class="px-2">fa-solid fa-paper-plane</v-icon></span></v-btn
                >
              </v-col>
            </v-row>
          </v-row>
        </v-container>
      </v-img>
    </v-row>
  </section>
</template>

<script>
/**
 * Export default
 */
export default {
  name: 'homeBannerComponent',
  props: ['ratio', 'app', 'statusMargin', 'banner'],
  data() {
    return {
      valid: true, // TODO: switch to false when forms will be reactive
      password: 'Password',
      rules: {
        email: (v) => /\S+@\S+\.\S+/.test(v) || '',
      },
    };
  },
  methods: {
    generateTemporalBackground() {
      return `${this.config.home.temporalBackground}/${`0${new Date().getHours()}`.slice(-2)}.jpg`;
    },
    goToAboutMe() {
      const el = document.getElementById('about-me');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
  },
};
</script>
