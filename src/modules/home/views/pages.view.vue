<template>
  <div>
    <homeBannerComponent
      v-bind:ratio="3"
      v-bind:subscribe="false"
      v-bind:app="{ subtitle: this.$route.meta.title }"
    ></homeBannerComponent>
    <section id="about-me">
      <v-container class="pb-12">
        <v-tabs centered grow>
          <v-tabs-slider></v-tabs-slider>
          <v-tab
            v-for="content in contents"
            :key="content.title"
            :href="`#tab-${content.title}`"
            :style="{
              background: config.vuetify.theme.themes[theme].background,
            }"
            >{{ content.title }}</v-tab
          >
          <v-tab-item
            v-for="content in contents"
            :key="content.title"
            :value="'tab-' + content.title"
          >
            <v-card
              flat
              tile
              :style="{
                background: config.vuetify.theme.themes[theme].surface,
              }"
            >
              <v-card-text class="pa-10">
                <vue-markdown :source="content.markdown" class="sinlink" />
              </v-card-text>
            </v-card>
          </v-tab-item>
        </v-tabs>
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
    ...mapGetters(['theme', 'contents']),
  },
  created() {
    this.$store.dispatch(this.$route.meta.data);
  },
  methods: {
    generateTemporalBackground() {
      return `${this.config.home.temporalBackground}/${`0${new Date().getHours()}`.slice(-2)}.jpg`;
    },
  },
};
</script>

<style>
.sinlink a {
  pointer-events: none;
  cursor: default;
  text-decoration: none;
  color: black;
}
</style>
