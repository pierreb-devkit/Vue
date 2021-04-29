<template>
  <div>
    <homeBannerComponent
      v-bind:ratio="3"
      v-bind:app="{ subtitle: this.$route.meta.title || this._.startCase(this.$route.params.name) }"
      v-bind:banner="contents.length == 1 && contents[0].banner ? contents[0].banner : null"
    ></homeBannerComponent>
    <section id="about-me">
      <v-container class="pb-12">
        <!-- Multiple Pages -->
        <v-tabs v-if="contents.length > 1" centered grow>
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
          <v-tab-item v-for="content in contents" :key="content.title" :value="'tab-' + content.title">
            <v-card
              flat
              :style="{
                background: config.vuetify.theme.themes[theme].surface,
                color: config.vuetify.theme.themes[theme].onSurface,
              }"
            >
              <v-card-text class="pa-4">
                <vue-markdown :source="content.markdown" :class="content.style" />
              </v-card-text>
            </v-card>
          </v-tab-item>
        </v-tabs>
      </v-container>
      <!-- One Page -->
      <v-container v-if="contents.length === 1" class="pt-0 pb-12">
        <v-card
          flat
          :style="{
            background: config.vuetify.theme.themes[theme].surface,
            color: config.vuetify.theme.themes[theme].onSurface,
          }"
        >
          <v-card-text class="pa-4">
            <vue-markdown :source="contents[0].markdown" :class="contents[0].style" />
          </v-card-text>
        </v-card>
      </v-container>
    </section>
    <homeLinksComponent
      v-bind:links="config.home.links"
      v-bind:custom="{
        section: { background: config.vuetify.theme.themes[theme].surface },
      }"
    ></homeLinksComponent>
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
    if (this.$route.params.name) this.$store.dispatch(this.$route.meta.data, this.$route.params.name);
    else this.$store.dispatch(this.$route.meta.data);
  },
  methods: {
    generateTemporalBackground() {
      return `${this.config.home.temporalBackground}/${`0${new Date().getHours()}`.slice(-2)}.jpg`;
    },
  },
};
</script>

<style>
@media print {
  .air *,
  .air :after,
  .air :before {
    background: 0 0 !important;
    box-shadow: none !important;
    text-shadow: none !important;
  }
  .air a,
  .air a:visited {
    text-decoration: underline;
  }
  .air a[href]:after {
    content: ' (' attr(href) ')';
  }
  .air abbr[title]:after {
    content: ' (' attr(title) ')';
  }
  .air a[href^='#']:after,
  .air a[href^='javascript:']:after {
    content: '';
  }
  .air blockquote,
  .air pre {
    border: 1px solid #999;
    page-break-inside: avoid;
  }
  .air thead {
    display: table-header-group;
  }
  .air img,
  .air tr {
    page-break-inside: avoid;
  }
  .air img {
    max-width: 100% !important;
  }
  .air h2,
  .air h3,
  .air p {
    orphans: 3;
    widows: 3;
  }
  .air h2,
  .air h3 {
    page-break-after: avoid;
  }
}
.air {
  font-size: 12px;
}
@media screen and (min-width: 32rem) and (max-width: 48rem) {
  .air {
    font-size: 15px;
  }
}
@media screen and (min-width: 48rem) {
  .air {
    font-size: 16px;
  }
}
.air {
  line-height: 1.85;
}
.air .air-p,
.air p {
  font-size: 1rem;
  margin-bottom: 1.3rem;
}
.air .air-h1,
.air .air-h2,
.air .air-h3,
.air .air-h4,
.air h1,
.air h2,
.air h3,
.air h4 {
  margin: 1.414rem 0 0.5rem;
  font-weight: 700;
  line-height: 1.42;
}
.air .air-h1,
.air h1 {
  margin-top: 0;
  font-size: 200%;
}
.air .air-h2,
.air h2 {
  font-size: 180%;
}
.air .air-h3,
.air h3 {
  font-size: 160%;
}
.air .air-h4,
.air h4 {
  font-size: 140%;
}
.air .air-h5,
.air h5 {
  font-size: 120%;
}
.air .air-h6,
.air h6 {
  font-size: 100%;
}
.air .air-small,
.air small {
  font-size: 0.707em;
}
.air canvas,
.air iframe,
.air img,
.air select,
.air svg,
.air textarea,
.air video {
  max-width: 100%;
}
.air {
  font-family: 'Open Sans', Helvetica, sans-serif;
  font-weight: 300;
  margin: 2rem auto 1rem;
  max-width: 48rem;
  text-align: center;
}
.air img {
  border-radius: 50%;
  height: 250px;
  margin: 5px auto;
  width: 250px;
}
.air a,
.air a:visited {
  color: #3498db;
}
.air a:active,
.air a:focus,
.air a:hover {
  color: #2980b9;
}
.air pre {
  background-color: #fafafa;
  padding: 1rem;
  text-align: left;
}
.air blockquote {
  margin: 0;
  border-left: 5px solid #7a7a7a;
  font-style: italic;
  padding: 1.33em;
  text-align: left;
}
.air li,
.air ol,
.air ul {
  text-align: left;
}
@media print {
  .classic *,
  .classic :after,
  .classic :before {
    background: 0 0 !important;
    box-shadow: none !important;
    text-shadow: none !important;
  }
  .classic a,
  .classic a:visited {
    text-decoration: underline;
  }
  .classic a[href]:after {
    content: ' (' attr(href) ')';
  }
  .classic abbr[title]:after {
    content: ' (' attr(title) ')';
  }
  .classic a[href^='#']:after,
  .classic a[href^='javascript:']:after {
    content: '';
  }
  .classic blockquote,
  .classic pre {
    border: 1px solid #999;
    page-break-inside: avoid;
  }
  .classic thead {
    display: table-header-group;
  }
  .classic img,
  .classic tr {
    page-break-inside: avoid;
  }
  .classic img {
    max-width: 100% !important;
  }
  .classic h2,
  .classic h3,
  .classic p {
    orphans: 3;
    widows: 3;
  }
  .classic h2,
  .classic h3 {
    page-break-after: avoid;
  }
}
.classic {
  font-size: 12px;
}
@media screen and (min-width: 32rem) and (max-width: 48rem) {
  .classic {
    font-size: 15px;
  }
}
@media screen and (min-width: 48rem) {
  .classic {
    font-size: 16px;
  }
}
.classic {
  line-height: 1.85;
}
.classic .classic-p,
.classic p {
  font-size: 1rem;
  margin-bottom: 1.3rem;
}
.classic .classic-h1,
.classic .classic-h2,
.classic .classic-h3,
.classic .classic-h4,
.classic h1,
.classic h2,
.classic h3,
.classic h4 {
  margin: 1.414rem 0 0.5rem;
  font-weight: 700;
  line-height: 1.42;
}
.classic .classic-h1,
.classic h1 {
  margin-top: 0;
  font-size: 200%;
}
.classic .classic-h2,
.classic h2 {
  font-size: 180%;
}
.classic .classic-h3,
.classic h3 {
  font-size: 160%;
}
.classic .classic-h4,
.classic h4 {
  font-size: 140%;
}
.classic .classic-h5,
.classic h5 {
  font-size: 120%;
}
.classic .classic-h6,
.classic h6 {
  font-size: 100%;
}
.classic .classic-small,
.classic small {
  font-size: 0.707em;
}
.classic canvas,
.classic iframe,
.classic img,
.classic select,
.classic svg,
.classic textarea,
.classic video {
  max-width: 100%;
}
.classic {
  font-family: 'Open Sans', Helvetica, sans-serif;
  font-weight: 300;
  margin: 2rem auto 1rem;
  max-width: 48rem;
  text-align: justify;
}
.classic a,
.classic a:visited {
  color: #3498db;
}
.classic a:active,
.classic a:focus,
.classic a:hover {
  color: #2980b9;
}
.classic pre {
  background-color: #fafafa;
  padding: 1rem;
  text-align: left;
}
.classic blockquote {
  margin: 0;
  border-left: 5px solid #7a7a7a;
  font-style: italic;
  padding: 1.33em;
  text-align: left;
}
.classic li,
.classic ol,
.classic ul {
  text-align: left;
}
.classic hr {
  padding: 0;
  margin-bottom: 30px;
  opacity: 25%;
}
.classic img[alt='icon'] {
  border-radius: 50%;
  width: 25px;
  height: 25px;
  margin: 0 10px -7px 10px;
}
</style>
