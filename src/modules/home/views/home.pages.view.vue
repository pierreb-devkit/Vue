<template>
  <div>
    <homeHeroComponent
      variant="blur"
      :ratio="3"
      :title="$route.meta.title || lodash.startCase($route.params.name)"
      :animation-speed="config.home.banner?.blur?.animationSpeed || 1"
      :background-colors="themeName === 'dark' ? config.home.banner?.blur?.dark?.backgroundColors : config.home.banner?.blur?.light?.backgroundColors"
      :halo-colors="themeName === 'dark' ? config.home.banner?.blur?.dark?.haloColors : config.home.banner?.blur?.light?.haloColors"
    ></homeHeroComponent>
    <section id="page" :style="style('section', config.pages)">
      <v-container class="py-12" :max-width="config.vuetify.theme.maxWidth">
        <v-row align="center" justify="center">
          <v-card :style="style('card', config.pages)" class="w-100">
            <v-tabs v-if="contents.length > 1" v-model="tab" fixed-tabs>
              <v-tab v-for="({ title }, i) in contents" :key="i" :value="i" color="secondary">{{ title }}</v-tab>
            </v-tabs>
            <v-card-text class="pa-12">
              <v-window v-model="tab">
                <v-window-item v-for="({ markdown, style: styleClass }, i) in contents" :key="i" :value="i">
                  <!-- A table too wide for the card scrolls sideways instead of being clipped. -->
                  <CoreProseComponent :class="[styleClass, 'home-prose', 'overflow-x-auto']">
                    <VMarkdown :source="markdown" />
                  </CoreProseComponent>
                </v-window-item>
              </v-window>
            </v-card-text>
          </v-card>
        </v-row>
      </v-container>
    </section>
  </div>
</template>

<script>
/**
 * Module dependencies.
 */
import { useTheme } from 'vuetify';
import { useHomeStore } from '../stores/home.store';
import { style } from '../../../lib/helpers/theme';
import homeHeroComponent from '../components/home.hero.component.vue';
import CoreProseComponent from '../../core/components/core.prose.component.vue';

/**
 * Component definition.
 */
export default {
  components: {
    homeHeroComponent,
    CoreProseComponent,
  },
  data() {
    const theme = useTheme();
    return {
      theme,
      page: null,
      tab: 0,
    };
  },
  computed: {
    themeName() {
      return this.theme.name;
    },
    contents() {
      const homeStore = useHomeStore();
      return homeStore.contents;
    },
  },
  watch: {
    $route(route) {
      if (route.params.name !== undefined && this.page !== route.params.name) {
        const homeStore = useHomeStore();
        const action = this.$route.meta.data;
        if (action === 'getPages') {
          homeStore.getPages(this.$route.params.name);
        }
        this.page = this.$route.params.name;
      }
    },
  },
  created() {
    const homeStore = useHomeStore();
    const action = this.$route.meta.data;
    if (this.$route.params.name) {
      if (action === 'getPages') {
        homeStore.getPages(this.$route.params.name);
      }
      this.page = this.$route.params.name;
    }
  },
  methods: {
    style,
  },
};
</script>

<style scoped>
/*
 * CMS pages are prose, not reference tables: a first-column code span wraps
 * like any other cell (the shared sheet keeps it on one line for the docs).
 */
.home-prose.core-prose :deep(td:first-child code) {
  white-space: normal;
}

/*
 * CMS page look (`style: 'classic'`), on top of the shared prose sheet
 * (CoreProseComponent): rendered markdown cannot take Vuetify classes.
 */
.classic {
  font-size: 1rem;
  line-height: 1.6;
  margin: 2rem auto 1rem;
  max-width: 48rem;
  text-align: justify;
}

.classic :deep(h1) {
  font-size: 1.75rem;
  line-height: 1.3;
  font-weight: 500;
  margin-block: 0 16px;
}

.classic :deep(li),
.classic :deep(ol),
.classic :deep(ul),
.classic :deep(pre),
.classic :deep(blockquote) {
  text-align: start;
}

.classic :deep(canvas),
.classic :deep(iframe),
.classic :deep(img),
.classic :deep(select),
.classic :deep(svg),
.classic :deep(textarea),
.classic :deep(video) {
  max-width: 100%;
}

.classic :deep(pre) {
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  background: rgba(var(--v-theme-on-surface), 0.05);
}

.classic :deep(blockquote) {
  margin: 0 0 12px;
  padding: 8px 16px;
  border-inline-start: 4px solid rgba(var(--v-border-color), var(--v-border-opacity));
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-style: italic;
}

.classic :deep(hr) {
  padding: 0;
  margin-bottom: 30px;
  opacity: 25%;
}

.classic :deep(img[alt='icon']) {
  border-radius: 50%;
  width: 25px;
  height: 25px;
  margin: 0 10px -7px 10px;
}

/* Print: no backgrounds, printed link targets, no page break inside a block. */
@media print {
  .classic :deep(*),
  .classic :deep(:after),
  .classic :deep(:before) {
    background: 0 0 !important;
    box-shadow: none !important;
    text-shadow: none !important;
  }
  .classic :deep(a),
  .classic :deep(a:visited) {
    text-decoration: underline;
  }
  .classic :deep(a[href]:after) {
    content: ' (' attr(href) ')';
  }
  .classic :deep(abbr[title]:after) {
    content: ' (' attr(title) ')';
  }
  .classic :deep(a[href^='#']:after),
  .classic :deep(a[href^='javascript:']:after) {
    content: '';
  }
  .classic :deep(blockquote),
  .classic :deep(pre) {
    border: 1px solid #999;
    page-break-inside: avoid;
  }
  .classic :deep(thead) {
    display: table-header-group;
  }
  .classic :deep(img),
  .classic :deep(tr) {
    page-break-inside: avoid;
  }
  .classic :deep(img) {
    max-width: 100% !important;
  }
  .classic :deep(h2),
  .classic :deep(h3),
  .classic :deep(p) {
    orphans: 3;
    widows: 3;
  }
  .classic :deep(h2),
  .classic :deep(h3) {
    page-break-after: avoid;
  }
}
</style>
