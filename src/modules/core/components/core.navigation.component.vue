<template>
  <div v-if="isLoggedIn && hasOrganization">
    <!-- Mobile drawer acces -->
    <v-btn
      v-if="$vuetify.display.mobile"
      :flat="config.vuetify.theme.flat"
      icon
      :style="{
        color: navColor,
        background: isGlass ? undefined : `${navBackground}99`,
        ...glassButtonStyle,
      }"
      style="position: fixed; top: 7px; left: 5px; z-index: 9999"
      @click="drawer = !drawer"
    >
      <v-icon icon="fa-solid fa-bars"></v-icon>
    </v-btn>
    <!-- Navigation drawer -->
    <v-navigation-drawer
      v-model="drawer"
      :floating="config.vuetify.theme.navigation.drawer.floating"
      :style="drawerStyle"
      :expand-on-hover="$vuetify.display.mobile ? false : config.vuetify.theme.navigation.drawer.expand"
      :rail="config.vuetify.theme.navigation.drawer.rail"
      :elevation="0"
    >
      <!-- Logo / drawer on mobile-->
      <v-list :style="listStyle" nav class="pt-4">
        <v-list-item
          :style="{ color: navColor }"
        >
          <template #prepend>
            <v-icon
              v-if="config.app.title"
              :style="{ color: navColor, opacity: 1 }"
              :icon="$vuetify.display.mobile ? 'nothing' : config.app.icon"
              size="large"
              class="ms-n1"
            ></v-icon>
          </template>
          <v-list-item-title>{{ config.app.title }}</v-list-item-title>
        </v-list-item>
      </v-list>
      <v-divider :color="navColor" :thickness="isGlass ? 1 : 3" :style="isGlass ? { opacity: 0.15 } : {}"></v-divider>
      <!-- Navigation -->
      <v-list :style="listStyle" nav>
        <v-list-item v-for="item in nav" :key="item.path" :to="item.path">
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
          <v-list-item v-for="item in navBottom" :key="item.path" :to="item.path">
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
import { useTheme } from 'vuetify';
import { useAuthStore } from '../../auth/stores/auth.store';
import { useCoreStore } from '../stores/core.store';
import { liquidGlassStyle } from '../../../lib/helpers/theme';
/**
 * Component definition.
 */
export default {
  name: 'DevkitNavigation',
  data() {
    const theme = useTheme();
    return {
      drawer: true,
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
        return {
          ...liquidGlassStyle({
            vuetifyTheme: this.theme,
            variant: this.isInset ? 'card' : 'header',
            border: 'none',
            extras: {
              color: this.theme.current.colors.onSurface,
            },
          }),
          ...(this.isInset ? { margin: '12px', height: 'calc(100% - 24px)', borderRadius: '16px' } : {}),
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
