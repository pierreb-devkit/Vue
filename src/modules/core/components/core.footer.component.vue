<template>
  <v-footer v-if="enabled" class="footer pa-0" :style="footerStyle" app>
    <v-container v-if="visibleSections.length > 0 || appVersion" class="px-0 py-4" :style="custom && custom.section ? custom.section : null">
      <v-row v-if="visibleSections.length > 0" density="compact" align="center" justify="center">
        <v-col
          v-for="({ items, title }, i) in visibleSections"
          :key="i"
          cols="12"
          :md="12 / visibleSections.length"
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
      <v-row v-if="appVersion" justify="center" class="mt-2">
        <v-col cols="12" class="text-center py-2">
          <component
            :is="appVersionHref ? 'a' : 'span'"
            v-bind="appVersionHref ? { href: appVersionHref, target: '_blank', rel: 'noopener noreferrer' } : {}"
            class="text-label-small text-medium-emphasis footer-version"
          >Web {{ appVersion }}</component>
          <span v-if="backendVersion" class="text-label-small text-medium-emphasis footer-version"> · API {{ backendVersion }}</span>
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
import { useFooterExtras } from '@/lib/composables/useFooterExtras';
import { useAuthStore } from '@/modules/auth/stores/auth.store';
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
  /**
   * @desc Initialise the footer extras registry so the footer can render
   * sections injected by optional modules (e.g. legal) without hard-importing them.
   * @returns {{ extras: import('vue').Ref<Array> }}
   */
  setup() {
    const { extras } = useFooterExtras();
    let authStore = null;
    try { authStore = useAuthStore(); } catch { authStore = null; }
    return { extras, authStore };
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
     * @desc Resolved display string for the app version badge.
     * Returns `null` when no version is configured so the element is omitted.
     * @returns {string|null}
     */
    appVersion() {
      const v = this.config?.app?.version;
      if (!v) return null;
      // Prefix semver tags with 'v' when not already prefixed
      if (/^\d/.test(v)) return `v${v}`;
      return v;
    },
    /**
     * @desc Href for the version badge link. Links to the GitHub tag when the
     * version looks like a semver release; links to the commit when it looks
     * like a `dev-<sha>` string. Returns `null` otherwise (e.g. plain `'dev'`).
     * @returns {string|null}
     */
    appVersionHref() {
      const v = this.config?.app?.version;
      const repoUrl = this.config?.app?.repository;
      if (!v || !repoUrl) return null;
      // Guard: only allow https:// repository URLs (defense-in-depth, build-time config)
      if (!repoUrl.startsWith('https://')) return null;
      // Normalise: strip leading 'v' before testing (some CI tools prefix the tag)
      const bare = v.replace(/^v/, '');
      // e.g. "1.36.0" or "v1.36.0" → link to GitHub releases tag
      if (/^\d+\.\d+\.\d+$/.test(bare)) return `${repoUrl}/releases/tag/v${bare}`;
      // e.g. "dev-abc1234" → link to GitHub commit
      const shaMatch = bare.match(/^dev-([0-9a-f]{7,40})$/i);
      if (shaMatch) return `${repoUrl}/commit/${shaMatch[1]}`;
      return null;
    },
    /**
     * @desc Combines the prop-provided footer links with sections registered by
     * optional modules via `useFooterExtras`. Extras whose title matches an
     * existing config-driven section are merged into that section (items
     * appended) rather than added as a new column — preventing duplicate
     * headings (e.g. two "Legal" columns).
     * @returns {Array}
     */
    allLinks() {
      const base = (this.links || []).map((s) => ({ ...s, items: [...(s.items || [])] }));
      const result = [...base];
      const extras = this.extras || [];
      for (const extra of extras) {
        const existingIdx = result.findIndex((s) => s.title === extra.title);
        if (existingIdx >= 0) {
          result[existingIdx] = {
            ...result[existingIdx],
            items: [...result[existingIdx].items, ...(extra.items || [])],
          };
        } else {
          result.push(extra);
        }
      }
      return result;
    },
    /**
     * @desc Resolved display string for the backend (API) version badge.
     * Read from the auth store's serverConfig, populated by the public
     * /api/auth/config endpoint (no login required). Returns `null` when
     * unavailable so the element is omitted (Pinia inactive, endpoint unreachable).
     * @returns {string|null}
     */
    backendVersion() {
      const v = this.authStore?.serverConfig?.app?.version;
      if (!v) return null;
      if (/^\d/.test(v)) return `v${v}`;
      return v;
    },
    /**
     * @desc Sections from allLinks that have items, used by the template to
     * avoid double-filtering (previously called twice inline in the template).
     * @returns {Array}
     */
    visibleSections() {
      return this.allLinks.filter((section) => section.items);
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
     * @desc Handle footer item click — dispatches `onClick` callback when present
     * (injected by optional modules), otherwise navigates to `url`.
     * @param {{ onClick?: Function, url?: string }} item
     */
    onItemClick(item) {
      if (typeof item.onClick === 'function') {
        item.onClick();
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

.footer-version {
  font-size: 0.7rem;
  text-decoration: none;
  opacity: 0.6;
}

.footer-version:hover {
  opacity: 1;
}
</style>
