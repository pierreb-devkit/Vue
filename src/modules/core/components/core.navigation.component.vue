<template>
  <div v-if="isLoggedIn && hasOrganization">
    <!-- Mobile drawer acces -->
    <v-btn
      v-if="$vuetify.display.mobile && !drawer"
      :flat="config.vuetify.theme.flat"
      icon
      :style="{
        color: navColor,
        background: isGlass ? undefined : `${navBackground}99`,
        ...glassButtonStyle,
      }"
      style="position: fixed; top: 7px; left: 5px; z-index: 9999"
      @click="drawer = true"
    >
      <v-icon icon="fa-solid fa-bars"></v-icon>
    </v-btn>
    <!-- Navigation drawer -->
    <v-navigation-drawer
      v-model="drawer"
      :floating="config.vuetify.theme.navigation.drawer.floating"
      :style="drawerStyle"
      :expand-on-hover="$vuetify.display.mobile ? false : config.vuetify.theme.navigation.drawer.expand"
      :rail="$vuetify.display.mobile ? false : config.vuetify.theme.navigation.drawer.rail"
      :temporary="$vuetify.display.mobile"
      :elevation="0"
    >
      <!-- Logo / drawer on mobile-->
      <v-list :style="listStyle" nav class="pt-4">
        <v-list-item
          class="devkit-logo-item"
          :style="{ color: navColor }"
          to="/"
        >
          <template #prepend>
            <v-img
              v-if="logoFile"
              :src="logoFile"
              :alt="config.app.title"
              :width="config.header.logo?.width || '32px'"
              :height="config.header.logo?.width || '32px'"
              class="ms-n1"
              inline
            ></v-img>
            <v-icon
              v-else-if="config.app.icon"
              :style="{ color: navColor, opacity: 1 }"
              :icon="config.app.icon"
              size="large"
              class="ms-n1"
            ></v-icon>
          </template>
          <v-list-item-title class="text-headline-small font-weight-bold">{{ config.app.title }}</v-list-item-title>
        </v-list-item>
      </v-list>
      <v-divider :color="navColor" :thickness="isGlass ? 1 : 3" :style="isGlass ? { opacity: 0.15 } : {}"></v-divider>
      <!-- Navigation -->
      <v-list :style="listStyle" nav>
        <v-list-item v-for="item in nav" :key="item.path" v-bind="navItemBind(item)">
          <template #prepend>
            <v-icon
              :icon="item.meta.icon"
              :style="{
                color: (item.meta.color && item.meta.color.icon) || navColor,
              }"
              size="small"
            ></v-icon>
          </template>
          <v-list-item-title>{{ item.name }}</v-list-item-title>
        </v-list-item>
      </v-list>
      <!-- Bottom section -->
      <template #append>
        <!-- Bottom nav items -->
        <v-list v-if="navBottom.length" :style="listStyle" nav>
          <v-list-item v-for="item in navBottom" :key="item.path" v-bind="navItemBind(item)">
            <template #prepend>
              <v-icon
                :icon="item.meta.icon"
                :style="{
                  color: (item.meta.color && item.meta.color.icon) || navColor,
                }"
                size="small"
              ></v-icon>
            </template>
            <v-list-item-title>{{ item.name }}</v-list-item-title>
          </v-list-item>
        </v-list>
        <template v-if="!config.vuetify.theme.footer">
          <v-list>
            <v-list-item v-for="({ icon, label, url }, i) in config.header.socials" :key="i" :href="url">
              <template #prepend>
                <v-icon>{{ icon }}</v-icon>
              </template>
              <v-list-item-title>{{ label }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </template>
        <!-- Compute gauge: button-shape above sign-out row (meterMode only) -->
        <v-list v-if="meterMode" :style="listStyle" nav class="py-0">
          <BillingNavComputeGaugeComponent :rail="isRail" />
        </v-list>
        <v-divider :color="navColor" :thickness="isGlass ? 1 : 3" :style="isGlass ? { opacity: 0.15 } : {}"></v-divider>
        <!-- Sign out -->
        <v-list :style="listStyle" nav>
          <v-list-item
            :style="{ color: navColor }"
            @click="signout"
          >
            <template #prepend>
              <v-icon
                :style="{ color: navColor }"
                icon="fa-solid fa-arrow-right"
                size="small"
              ></v-icon>
            </template>
            <v-list-item-title>Sign out</v-list-item-title>
          </v-list-item>
        </v-list>
      </template>
    </v-navigation-drawer>
  </div>
</template>

<script>
/**
 * Module dependencies.
 */
import { useTheme, useDisplay } from 'vuetify';
import { useAuthStore } from '../../auth/stores/auth.store';
import { useCoreStore } from '../stores/core.store';
import { liquidGlassStyle } from '../../../lib/helpers/theme';
// billing module is a devkit core dependency (not optional) — all downstream
// projects include it. This follows the same pattern as user.view.vue importing
// BillingSubscriptionsComponent. A consolidated cross-module refactor is tracked
// as tech debt; this PR does not introduce a new pattern.
import BillingNavComputeGaugeComponent from '../../billing/components/billing.navComputeGauge.component.vue';
/**
 * Component definition.
 */
export default {
  name: 'DevkitNavigation',
  components: {
    BillingNavComputeGaugeComponent,
  },
  data() {
    const theme = useTheme();
    return {
      drawer: !useDisplay().mobile.value,
      theme,
    };
  },
  computed: {
    nav() {
      const coreStore = useCoreStore();
      return coreStore.nav;
    },
    navBottom() {
      const coreStore = useCoreStore();
      return coreStore.navBottom;
    },
    isLoggedIn() {
      const authStore = useAuthStore();
      return authStore.isLoggedIn;
    },
    hasOrganization() {
      const authStore = useAuthStore();
      if (!authStore.serverConfig?.organizations?.enabled) return true;
      return !!authStore.user?.currentOrganization;
    },
    /**
     * @desc Whether the app is in meter mode (compute billing active).
     * @returns {Boolean}
     */
    meterMode() {
      const authStore = useAuthStore();
      return authStore.serverConfig?.billing?.meterMode === true;
    },
    /**
     * @desc Whether the navigation drawer is in rail (collapsed icon-only) mode.
     * True when not on mobile and the drawer rail config is enabled.
     * @returns {Boolean}
     */
    isRail() {
      return !this.$vuetify.display.mobile && !!this.config.vuetify.theme.navigation.drawer.rail;
    },
    /**
     * @desc Logo file — header config takes priority, falls back to app.logoFile.
     * @returns {String|null}
     */
    logoFile() {
      return this.config.header?.logo?.file || this.config.app.logoFile || null;
    },
    /**
     * @desc Whether the liquid glass mode is enabled.
     * @returns {Boolean}
     */
    isGlass() {
      return !!this.config.vuetify.theme.navigation.glass;
    },
    /**
     * @desc Whether the inset floating mode is enabled.
     * @returns {Boolean}
     */
    isInset() {
      return !!this.config.vuetify.theme.navigation.inset;
    },
    /**
     * @desc Text/icon color — theme-aware in glass mode, config-driven otherwise.
     * @returns {String}
     */
    navColor() {
      if (this.isGlass) return this.theme.current.colors.onSurface;
      return this.config.vuetify.theme.navigation.color;
    },
    /**
     * @desc Background color from config (used in non-glass mode).
     * @returns {String}
     */
    navBackground() {
      return this.config.vuetify.theme.navigation.background;
    },
    /**
     * @desc Inline styles for the navigation drawer.
     * @returns {Object} CSS style object
     */
    drawerStyle() {
      if (this.isGlass) {
        const isMobile = this.$vuetify.display.mobile;
        const applyLeftInset = this.isInset && (!isMobile || this.drawer);
        return {
          ...liquidGlassStyle({
            vuetifyTheme: this.theme,
            variant: this.isInset ? 'card' : 'header',
            border: 'none',
            extras: {
              color: this.theme.current.colors.onSurface,
            },
          }),
          ...(this.isInset
            ? {
                marginTop: '12px',
                marginBottom: '12px',
                marginLeft: applyLeftInset ? '12px' : '0',
                marginRight: '12px',
                height: 'calc(100% - 24px)',
                borderRadius: '16px',
              }
            : {}),
        };
      }
      return { background: this.navBackground };
    },
    /**
     * @desc Transparent list background in glass mode, solid otherwise.
     * @returns {Object} CSS style object
     */
    listStyle() {
      return {
        background: this.isGlass ? 'transparent' : this.navBackground,
        color: this.navColor,
      };
    },
    /**
     * @desc Glass style for mobile button (only in glass mode).
     * @returns {Object} CSS style object
     */
    glassButtonStyle() {
      if (!this.isGlass) return {};
      return liquidGlassStyle({
        vuetifyTheme: this.theme,
      });
    },
  },
  created() {
    const coreStore = useCoreStore();
    const authStore = useAuthStore();
    coreStore.refreshNav(authStore.isLoggedIn);
  },
  methods: {
    /**
     * @desc Build the v-bind props for a sidenav item — external link (`meta.href`)
     *       resolves to `{ href, target, rel }` so Vuetify renders an anchor tag
     *       (and never applies the active-route styling), internal routes resolve
     *       to `{ to }` and keep the default router-link behavior.
     * @param {Object} item - Nav item from the core store (route record).
     * @returns {Object} Props bag to spread onto `<v-list-item>`.
     */
    navItemBind(item) {
      if (item?.meta?.href) {
        return {
          href: item.meta.href,
          target: item.meta.target || '_blank',
          rel: item.meta.rel || 'noopener',
        };
      }
      return { to: item.path };
    },
    async signout() {
      const authStore = useAuthStore();
      const coreStore = useCoreStore();

      await authStore.signout();
      coreStore.refreshNav(authStore.isLoggedIn);

      if (this.$route.path !== '/') this.$router.push('/');
    },
  },
};
</script>

<style scoped>
.devkit-logo-item :deep(.v-list-item__overlay) {
  display: none;
}
</style>
