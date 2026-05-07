<template>
  <v-footer v-if="enabled" class="footer pa-0 align-end" :style="footerStyle" app>
    <v-container v-if="allLinks.length > 0" class="px-0 py-4" :style="custom && custom.section ? custom.section : null">
      <v-row density="compact" align="center" justify="center">
        <v-col
          v-for="({ items, title }, i) in allLinks.filter((section) => section.items)"
          :key="i"
          cols="12"
          :md="12 / allLinks.filter((section) => section.items).length"
          class="text-center"
        >
          <v-card color="transparent" :flat="config.vuetify.theme.flat" :style="custom && custom.section ? custom.section : null">
            <v-card-title class="text-center text-title-medium font-weight-bold text-medium-emphasis">{{ title }}</v-card-title>
            <v-list class="bg-transparent" :style="custom && custom.section ? custom.section : null" density="compact">
              <v-list-item v-for="(item, idx) in items" :key="idx" class="justify-center" @click="onItemClick(item)">
                <v-list-item-title>
                  <v-icon size="14" class="mr-2 text-onSurface text-medium-emphasis">{{ item.icon }}</v-icon>
                  <span class="text-onSurface text-high-emphasis text-label-small"> {{ item.label }} </span>
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-footer>
</template>

<script>
/**
 * Module dependencies.
 */
import { useTheme } from 'vuetify';
import { useCookieConsent } from '@/modules/legal/composables/useCookieConsent';
/**
 * Component definition.
 */
export default {
  name: 'DevkitFooter',
  props: {
    links: {
      type: Array,
      default: () => [],
    },
    variant: {
      type: String,
      default: 'default',
      validator: (value) => ['default', 'alternate'].includes(value),
    },
    custom: {
      type: Object,
      default: null,
    },
  },
  setup() {
    const { reopenSettings } = useCookieConsent();
    return { reopenSettings };
  },
  data() {
    const theme = useTheme();
    return {
      theme,
      enabled: false,
    };
  },
  computed: {
    themeName() {
      return this.theme.name;
    },
    /**
     * @desc Resolve the footer variant, allowing a validated home-page config override.
     * @returns {string} The resolved footer variant ('default' | 'alternate').
     */
    resolvedVariant() {
      const allowedVariants = ['default', 'alternate'];
      const homeFooterVariant = this.config?.home?.footer?.variant;
      if (this.$route?.path === '/' && allowedVariants.includes(homeFooterVariant)) return homeFooterVariant;
      return this.variant;
    },
    footerStyle() {
      const bgColor = this.resolvedVariant === 'alternate' ? this.theme.current.colors.surface : this.theme.current.colors.background;
      return {
        background: bgColor,
      };
    },
    /**
     * @desc Build the Legal footer section from config.legal.
     * Returns null when neither cookieConsent nor pages are enabled.
     * @returns {{ title: string, items: Array }|null}
     */
    legalSection() {
      const cc = this.config?.legal?.cookieConsent;
      const pages = this.config?.legal?.pages;
      const items = [];
      if (pages?.enabled && pages.items) {
        Object.values(pages.items)
          .filter((it) => it.enabled)
          .forEach((it) => {
            items.push({
              label: it.title,
              icon: 'fa-solid fa-file-lines',
              url: `${pages.routePrefix || '/legal'}/${it.slug}`,
            });
          });
      }
      if (cc?.enabled) {
        items.push({
          label: this.$t('legal.footer.cookieSettings'),
          icon: 'fa-solid fa-cookie-bite',
          action: 'cookieSettings',
        });
      }
      if (items.length === 0) return null;
      return { title: this.$t('legal.footer.sectionTitle'), items };
    },
    /**
     * @desc Combines the prop-provided footer links with the auto-injected Legal section.
     * @returns {Array}
     */
    allLinks() {
      const base = this.links || [];
      return this.legalSection ? [...base, this.legalSection] : base;
    },
  },
  watch: {
    $route(route) {
      if (route.meta && route.meta.footer) this.enabled = true;
      else this.enabled = false;
    },
  },
  created() {
    const route = this.$route;
    if (route?.meta?.footer) this.enabled = true;
  },
  methods: {
    navigate(link) {
      if (link.startsWith('http')) {
        window.open(link, '_blank');
      } else {
        this.$router.push(link);
      }
    },
    /**
     * @desc Handle footer item click — branches on action type.
     * @param {{ action?: string, url?: string }} item
     */
    onItemClick(item) {
      if (item.action === 'cookieSettings') {
        this.reopenSettings();
      } else if (item.url) {
        this.navigate(item.url);
      }
    },
  },
};
</script>

<style>
.footer {
  position: relative !important;
}
</style>
