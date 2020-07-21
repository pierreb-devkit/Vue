<template>
  <section id="hero">
    <v-row no-gutters>
      <v-img
        :min-height="'calc(100vh/' + ratio + ' - ' + $vuetify.application.top + 'px)'"
        :max-height="'calc(100vh/' + ratio + ' - ' + $vuetify.application.top + 'px)'"
        :src="
          config.home.temporalBackground
            ? generateTemporalBackground()
            : require('@/assets/images/background.jpg')
        "
      >
        <v-theme-provider dark>
          <v-container fill-height>
            <v-row align="center" class="white--text mx-auto" justify="center">
              <v-col class="white--text text-center" cols="12" tag="h1">
                <span
                  v-if="app.title && !app.logo"
                  :class="[$vuetify.breakpoint.smAndDown ? 'display-3' : 'display-4']"
                  class="font-weight-black"
                  >{{ app.title }}</span
                >
                <center><v-img v-if="app.logo" :src="require('@/assets/images/' + this.config.app.logo)" aspect-ratio="5" max-width="375"></v-img></center>
                <br />
                <span
                  v-if="app.subtitle"
                  class="font-weight-light"
                  :class="[$vuetify.breakpoint.smAndDown ? 'display-1' : 'display-1']"
                  >{{ app.subtitle }}</span
                >
              </v-col>
              <v-col class="white--text text-center" cols="12">
                <v-btn
                  class="align-self-end"
                  fab
                  outlined
                  @click="$vuetify.goTo('#about-me')"
                  data-aos="fade-up"
                >
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
                style="bottom: 10%; position: absolute; opacity:75%;"
                data-aos="fade-up"
                v-if="config.home.subscriptions && subscribe"
              >
                <v-text-field
                  v-model="email"
                  :flat="config.vuetify.theme.flat"
                  :rules="[rules.email]"
                  :append-icon="'fa-envelope'"
                  @click:append="createSubscription"
                  @keydown.enter="createSubscription"
                  height="55"
                  name="Mail"
                  placeholder="Stay informed by email."
                  class="centered-input"
                  solo
                  rounded
                  light
                ></v-text-field>
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
 * Module dependencies.
 */
import { mapGetters } from 'vuex';
/**
 * Export default
 */
export default {
  name: 'homeBannerComponent',
  props: ['ratio', 'subscribe', 'app'],
  data() {
    return {
      valid: false,
      password: 'Password',
      rules: {
        email: (v) => /\S+@\S+\.\S+/.test(v) || '',
      },
    };
  },
  computed: {
    ...mapGetters(['subscription']),
    email: {
      get() {
        return this.subscription.email;
      },
      set(email) {
        this.save = true;
        this.$store.commit('subscription_update', { email });
      },
    },
  },
  methods: {
    generateTemporalBackground() {
      return `${this.config.home.temporalBackground}/${`0${new Date().getHours()}`.slice(-2)}.jpg`;
    },
    createSubscription() {
      if (this.rules.email(this.subscription.email)) {
        this.$store
          .dispatch('createSubscription', this.subscription)
          .catch((err) => console.log(err));
      }
    },
  },
};
</script>
