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
              <v-card-text class="pa-2">
                <vue-markdown :source="content.markdown" :class="content.style" />
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
@media print{.air *,.air :after,.air :before{background:0 0!important;color:#000!important;box-shadow:none!important;text-shadow:none!important}.air a,.air a:visited{text-decoration:underline}.air a[href]:after{content:" (" attr(href) ")"}.air abbr[title]:after{content:" (" attr(title) ")"}.air a[href^="#"]:after,.air a[href^="javascript:"]:after{content:""}.air blockquote,.air pre{border:1px solid #999;page-break-inside:avoid}.air thead{display:table-header-group}.air img,.air tr{page-break-inside:avoid}.air img{max-width:100%!important}.air h2,.air h3,.air p{orphans:3;widows:3}.air h2,.air h3{page-break-after:avoid}}.air{font-size:12px}@media screen and (min-width:32rem) and (max-width:48rem){.air{font-size:15px}}@media screen and (min-width:48rem){.air{font-size:16px}}.air{line-height:1.85}.air .air-p,.air p{font-size:1rem;margin-bottom:1.3rem}.air .air-h1,.air .air-h2,.air .air-h3,.air .air-h4,.air h1,.air h2,.air h3,.air h4{margin:1.414rem 0 .5rem;font-weight:700;line-height:1.42}.air .air-h1,.air h1{margin-top:0;font-size:200%}.air .air-h2,.air h2{font-size:180%}.air .air-h3,.air h3{font-size:160%}.air .air-h4,.air h4{font-size:140%}.air .air-h5,.air h5{font-size:120%}.air .air-h6,.air h6{font-size:100%}.air .air-small,.air small{font-size:.707em}.air canvas,.air iframe,.air img,.air select,.air svg,.air textarea,.air video{max-width:100%}.air{color:#444;font-family:'Open Sans',Helvetica,sans-serif;font-weight:300;margin:2rem auto 1rem;max-width:48rem;text-align:center}.air img{border-radius:50%;height:250px;margin:5px auto;width:250px}.air a,.air a:visited{color:#3498db}.air a:active,.air a:focus,.air a:hover{color:#2980b9}.air pre{background-color:#fafafa;padding:1rem;text-align:left}.air blockquote{margin:0;border-left:5px solid #7a7a7a;font-style:italic;padding:1.33em;text-align:left}.air li,.air ol,.air ul{text-align:left}.air p{color:#777}
</style>
