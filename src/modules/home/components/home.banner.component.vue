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
        :min-height="'calc(100vh/' + ratio + ' - ' + $vuetify.application.top + 'px)'"
        :max-height="'calc(100vh/' + ratio + ' - ' + $vuetify.application.top + 'px)'"
        :src="banner ? banner : config.home.temporalBackground ? generateTemporalBackground() : require('@/assets/images/background.jpg')"
        :gradient="banner ? 'rgba(0,0,0,.25), rgba(0,0,0,.25)' : ''"
      >
        <v-theme-provider dark>
          <v-container fill-height>
            <v-row align="center" class="white--text mx-auto" justify="center" style="margin-top: -100px">
              <v-col class="white--text text-center" cols="12" tag="h1">
                <span v-if="app.title && !app.logo" :class="[$vuetify.breakpoint.smAndDown ? 'display-3' : 'display-4']" class="font-weight-black">{{
                  app.title
                }}</span>
                <center>
                  <v-img v-if="app.logo" :src="require('@/assets/images/' + this.config.app.logo)" aspect-ratio="5" max-width="375" class="mb-2">
                  </v-img>
                </center>
                <span v-if="app.status && app.status !== ''" class="font-weight-light display-0" style="opacity: 0.5">{{ app.status }}</span>
                <br />
                <br />
                <br v-if="!app.title && !app.logo" />
                <br v-if="!app.title && !app.logo" />
                <span v-if="app.subtitle" class="font-weight-light" :class="[$vuetify.breakpoint.smAndDown ? 'display-1' : 'display-1']">{{
                  app.subtitle
                }}</span>
              </v-col>
              <v-col class="white--text text-center" cols="12" v-if="ratio == 1">
                <v-btn class="align-self-end" fab @click="$vuetify.goTo('#about-me')" data-aos="fade-up" color="transparent" elevation="0">
                  <v-icon>fa-angle-down</v-icon>
                </v-btn>
              </v-col>
              <v-col
                align="center"
                class="white--text text-center"
                cols="11"
                xs="10"
                sm="9"
                md="7"
                lg="6"
                xl="5"
                style="bottom: 5%; position: absolute; opacity: 75%"
                data-aos="fade-up"
                v-if="config.home.blog && config.home.blog.subscribe && ratio == 1"
              >
                <v-btn :href="config.home.blog.subscribe" target="_blank" class="px-10" height="55" elevation="0" rounded light
                  ><span style="color: gray">Stay informed by email<v-icon class="pl-8">fa-paper-plane</v-icon></span></v-btn
                >
              </v-col>
            </v-row>
          </v-container>
        </v-theme-provider>
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
      valid: false,
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
  },
};
</script>
