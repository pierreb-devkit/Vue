<template>
  <div>
    <homeBannerComponent
      v-bind:ratio="1"
      v-bind:subscribe="true"
      v-bind:app="config.app"
    ></homeBannerComponent>

    <section id="about-me" v-if="config.home.abouts.length > 0">
      <v-container class="text-center pb-12">
        <v-row align="center" justify="center">
          <v-col
            v-for="({ title, text, image, button, link }, i) in config.home.abouts"
            :key="i"
            cols="12"
            md="6"
          >
            <h2 class="display-1 font-weight-bold mb-3 py-8  text-uppercase" v-text="title"></h2>
            <v-responsive class="mx-auto title font-weight-light mb-8" max-width="720">
              <vue-markdown :source="text" />
            </v-responsive>
            <v-avatar v-if="image" class="elevation-12 mb-12" size="128">
              <v-img :src="image"></v-img>
            </v-avatar>
            <br v-if="link" />
            <v-btn v-if="link" color="grey" :href="link" outlined large>
              <span class="grey--text text--darken-1 font-weight-bold" v-text="button"></span>
            </v-btn>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <section
      id="features"
      class="py-12"
      :style="{ background: config.vuetify.theme.themes[theme].surface }"
      v-if="config.home.features.data.length > 0"
    >
      <v-container class="text-center">
        <h2
          class="display-1 font-weight-bold mb-3 pb-8 text-uppercase"
          v-if="config.home.features.title"
        >
          {{ config.home.features.title }}
        </h2>
        <v-row>
          <v-col
            v-for="({ icon, title, text }, i) in config.home.features.data"
            :key="i"
            cols="12"
            md="4"
          >
            <v-card
              class="py-12 px-4"
              :flat="config.vuetify.theme.flat"
              :style="{ background: config.vuetify.theme.themes[theme].background }"
            >
              <div>
                <v-avatar color="primary" size="88">
                  <v-icon dark large data-aos="fade-up">{{ icon }}</v-icon>
                </v-avatar>
              </div>
              <v-card-title
                class="justify-center font-weight-black text-uppercase"
                v-text="title"
              ></v-card-title>
              <v-card-text class="subtitle-1 text--secondary"
                ><vue-markdown :source="text"
              /></v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <section id="stats" class="black" v-if="config.home.stats.data.length > 0">
      <v-parallax
        :height="$vuetify.breakpoint.smAndDown ? 700 : 500"
        :src="config.home.stats.background || require('@/assets/images/backgroundParalax.jpg')"
      >
        <v-container fill-height>
          <v-row class="mx-auto">
            <v-col v-for="[value, title] of config.home.stats.data" :key="title" cols="12" md="3">
              <div class="text-center">
                <div class="display-3 font-weight-black mb-4" v-text="value" data-aos="fade"></div>
                <div class="title font-weight-regular text-uppercase" v-text="title"></div>
              </div>
            </v-col>
          </v-row>
        </v-container>
      </v-parallax>
    </section>

    <section
      id="blog"
      class="py-12"
      :style="{ background: config.vuetify.theme.themes[theme].surface }"
    >
      <v-container>
        <h2
          class="display-1 font-weight-bold mb-3 pb-8 text-center text-uppercase"
          v-if="config.home.blog.title"
        >
          <a :href="config.home.blog.url" style="font-weight:inherit; color:inherit !important;">{{
            config.home.blog.title
          }}</a>
        </h2>
        <v-row>
          <v-col
            v-for="({ feature_image, excerpt, title, url }, i) in news"
            :key="i"
            cols="12"
            md="4"
          >
            <v-img :src="feature_image" class="mb-4" height="275" max-width="100%"></v-img>
            <h3 class="mb-4 text--primary" v-text="title"></h3>
            <div class="subtitle-1 text--secondary"><vue-markdown :source="excerpt" /></div>
            <v-btn class="ml-n5 font-weight-black" :href="url" target="_blank" text
              >Continue Reading</v-btn
            >
          </v-col>
        </v-row>
      </v-container>
    </section>

    <section id="contact" class="py-12">
      <v-container>
        <h2
          class="display-1 font-weight-bold mb-3 pb-8 text-center text-uppercase"
          v-if="config.home.contact.title"
        >
          {{ config.home.contact.title }}
        </h2>
        <v-theme-provider light>
          <v-form ref="form">
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="subject"
                  :flat="config.vuetify.theme.flat"
                  name="subject"
                  label="Subject*"
                  solo
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="body"
                  :flat="config.vuetify.theme.flat"
                  label="Message*"
                  solo
                ></v-textarea>
              </v-col>
              <v-col class="mx-auto" cols="auto">
                <v-btn
                  @click="sendMail()"
                  :color="config.vuetify.theme.themes[theme].secondary"
                  :style="{ color: config.vuetify.theme.themes[theme].onSecondary }"
                  depressed
                  x-large
                  >Send</v-btn
                >
              </v-col>
            </v-row>
          </v-form>
        </v-theme-provider>
      </v-container>
    </section>

    <homeLinksComponent v-bind:links="config.home.links"></homeLinksComponent>
  </div>
</template>

<script>
/**
 * Module dependencies.
 */
import { mapGetters } from 'vuex';
import AOS from 'aos';
import 'aos/dist/aos.css';
import VueMarkdown from 'vue-markdown'; // production
import homeBannerComponent from '../components/home.banner.component.vue';
import homeLinksComponent from '../components/home.links.component.vue';

/**
 * Export default
 */
export default {
  data() {
    return {
      valid: false,
      password: 'Password',
      rules: {
        email: (v) => /\S+@\S+\.\S+/.test(v) || '',
      },
    };
  },
  components: {
    VueMarkdown,
    homeBannerComponent,
    homeLinksComponent,
  },
  computed: {
    ...mapGetters(['theme', 'news', 'contact', 'statistics']),
    subject: {
      get() {
        return this.contact.subject;
      },
      set(subject) {
        this.save = true;
        this.$store.commit('contact_update', { subject });
      },
    },
    body: {
      get() {
        return this.contact.body;
      },
      set(body) {
        this.save = true;
        this.$store.commit('contact_update', { body });
      },
    },
  },
  created() {
    AOS.init();
    this.$store.dispatch('getStatistics').then(() => {
      this.$store.dispatch('getNews');
    });
  },
  methods: {
    sendMail() {
      window.location.href = `${this.config.home.contact.mail}?subject=${
        this.contact.subject
      }&body=${this.contact.body.replace(/\n/g, '%0D%0A')}`;
      this.$refs.form.reset();
    },
  },
};
</script>

<style>
.centered-input >>> input {
  text-align: center;
  font-size: 20px;
}
</style>
