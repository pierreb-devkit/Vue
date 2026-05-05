<template>
  <v-app-bar
    v-if="!isLoggedIn || $route.path === '/organization-required'"
    :style="headerStyle"
    :flat="config.vuetify.theme.flat"
    :scroll-behavior="isFloatMode ? undefined : config.vuetify.theme.header?.scrollBehavior"
    class="devkit-app-bar"
    :class="{ 'devkit-app-bar--float': isFloatMode, 'devkit-app-bar--scrolled': isFloatMode && isScrolled }"
  >
    <v-container :style="{ maxWidth: config.vuetify.theme.maxWidth }" class="d-flex align-center px-4 py-0">
      <!-- Logo/Title lockup -->
      <router-link
        v-if="config.header.logo && config.header.logo.file"
        to="/"
        class="d-inline-flex align-center mr-4 text-decoration-none"
        :style="{ color: 'inherit' }"
      >
        <v-img
          :src="config.header.logo.file"
          :height="config.header.logo.width || '36px'"
          :width="config.header.logo.width || '36px'"
          inline
          alt="logo"
        />
        <h1 v-if="config.header.title" class="text-headline-small font-weight-bold ml-2">{{ config.app.title }}</h1>
      </router-link>
      <router-link v-else-if="config.header.title" to="/" class="text-decoration-none mr-4" :style="{ color: 'inherit' }">
        <h1 class="text-headline-small font-weight-bold">{{ config.app.title }}</h1>
      </router-link>
      <!-- Menu -->
      <span v-for="({ title, url, sublinks }, i) in config.header.links" :key="i" class="hidden-sm-and-down">
        <v-btn v-if="!sublinks" class="text-none text-body-medium" @click="navigate(url)">
          {{ title }}
        </v-btn>
        <v-menu v-if="sublinks" location="bottom" max-width="400px">
          <template #activator="{ props }">
            <v-btn v-bind="props" class="text-none text-body-large">
              {{ title }}
              <v-icon class="mt-1 ml-2" size="x-small">fa-solid fa-angle-down</v-icon>
            </v-btn>
          </template>
          <v-list lines="two" class="px-0 py-0 mt-6 gradient-border-menu" :class="config.vuetify.theme.rounded" :style="glassStyle()" density="compact">
            <v-list-item
              v-for="({ icon, title: linkTitle, url: linkUrl, color, subtitle }, j) in sublinks"
              :key="j"
              class="px-6 py-3"
              @click="navigate(linkUrl)"
            >
              <template #prepend>
                <v-icon :color="color" size="small">{{ icon }}</v-icon>
              </template>
              <v-list-item-title class="text-body-large font-weight-medium">{{ linkTitle }}</v-list-item-title>
              <v-list-item-subtitle v-if="subtitle" class="text-body-small">{{ subtitle }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-menu>
      </span>
      <!-- Space -->
      <v-spacer></v-spacer>
      <!-- Login buttons -->
      <v-btn v-if="!isLoggedIn && config.sign.in" class="text-none" @click="navigate('/signin')"> Sign In </v-btn>
      <!-- shortcut buttons -->
      <v-btn
        v-for="({ title, url, variant }, i) in config.header.shortcuts"
        :key="i"
        class="hidden-sm-and-down text-none text-body-medium mr-2"
        :class="`${config.vuetify.theme.rounded}`"
        :variant="variant"
        :style="{ color: theme.current.colors.onBackground }"
        @click="navigate(url)"
      >
        {{ title }}
      </v-btn>
      <!-- Mobile Menu -->
      <v-menu location="bottom" offset="20px">
        <template #activator="{ props }">
          <v-btn v-bind="props" class="hidden-md-and-up" icon>
            <v-icon :style="{ color: config.vuetify.theme.header?.color }">fa-solid fa-bars</v-icon>
          </v-btn>
        </template>
        <v-card min-width="300px" class="gradient-border-menu" :class="config.vuetify.theme.rounded" :style="glassStyle()">
          <!-- Menu -->
          <v-list density="compact">
            <v-list-item v-for="({ title, sublinks }, i) in config.header.links.filter((v) => v.sublinks)" :key="i">
              <v-list-item-title class="text-title-medium font-weight-bold text-medium-emphasis">{{ title }}</v-list-item-title>
              <v-list lines="one" density="compact">
                <v-list-item v-for="({ icon, title: linkTitle, url: linkUrl, color, subtitle }, j) in sublinks" :key="j" @click="navigate(linkUrl)">
                  <template #prepend>
                    <v-icon :color="color" size="small">{{ icon }}</v-icon>
                  </template>
                  <v-list-item-title class="text-body-medium font-weight-medium">{{ linkTitle }}</v-list-item-title>
                  <v-list-item-subtitle v-if="subtitle" class="text-label-small">{{ subtitle }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-list-item>
          </v-list>
          <v-divider></v-divider>
          <!-- Menu 2 -->
          <v-list class="mx-2" density="compact">
            <v-list-item v-for="({ title, url }, i) in config.header.links.filter((v) => !v.sublinks)" :key="i" @click="navigate(url)">
              <v-list-item-title class="text-body-medium font-weight-medium">{{ title }}</v-list-item-title>
            </v-list-item>
          </v-list>
          <v-divider></v-divider>
          <!-- Shortcut -->
          <v-list-item v-for="({ title, url, variant }, i) in config.header.shortcuts" :key="i" class="my-2">
            <v-btn
              :variant="variant"
              :style="{
                background: config.vuetify.theme.header.background,
                color: config.vuetify.theme.header.color,
              }"
              class="text-none text-body-medium"
              width="100%"
              @click="navigate(url)"
            >
              {{ title }}
            </v-btn>
          </v-list-item>
        </v-card>
      </v-menu>
    </v-container>
  </v-app-bar>
</template>
<script>
/**
 * Module dependencies.
 */
import { useTheme } from 'vuetify';
import { useAuthStore } from '../../auth/stores/auth.store';
import { liquidGlassStyle, colorModeStyle } from '../../../lib/helpers/theme';

/**
 * Component definition.
 */
export default {
  name: 'DevkitAppBar',
  data() {
    const theme = useTheme();
    return {
      theme,
      isScrolled: false,
      handleScroll: null,
    };
  },
  computed: {
    themeName() {
      return this.theme.name;
    },
    isLoggedIn() {
      const authStore = useAuthStore();
      return authStore.isLoggedIn;
    },
    /**
     * @desc Whether the header uses the 'float' scroll behavior mode.
     * @returns {Boolean} true if scrollBehavior is 'float'
     */
    isFloatMode() {
      return this.config.vuetify.theme.header?.scrollBehavior === 'float';
    },
    /**
     * @desc Computed header inline styles. In float mode, switches between full-width
     *       and a centered floating pill when scrolled past the threshold.
     * @returns {Object} CSS style object
     */
    headerStyle() {
      const scrolled = this.isFloatMode && this.isScrolled;
      const maxW = this.config.vuetify.theme.maxWidth || '1200px';
      return {
        ...this.glassStyle(scrolled ? 'card' : 'header'),
        // Float mode: center via left/right auto margins, only animate width + border-radius
        ...(this.isFloatMode
          ? {
              left: '0',
              right: '0',
              marginLeft: 'auto',
              marginRight: 'auto',
              width: scrolled ? `min(${maxW}, calc(100% - 24px))` : '100%',
              borderRadius: scrolled ? '12px' : '0',
            }
          : { width: '100%' }),
        // When scrolled in float mode, drop colorMode override so text uses theme's onSurface
        ...(scrolled ? { color: this.theme.current.colors.onSurface } : {}),
      };
    },
  },
  mounted() {
    if (this.isFloatMode) {
      const threshold = this.config.vuetify.theme.header?.scrollThreshold ?? 50;
      let ticking = false;
      this.handleScroll = () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            this.isScrolled = window.scrollY > threshold;
            ticking = false;
          });
          ticking = true;
        }
      };
      window.addEventListener('scroll', this.handleScroll, { passive: true });
      this.handleScroll();
    }
  },
  beforeUnmount() {
    if (this.handleScroll) {
      window.removeEventListener('scroll', this.handleScroll);
    }
  },
  methods: {
    /**
     * @desc Build liquid glass style for header and dropdown menus.
     * @param {String} variant - liquidGlass variant ('header', 'card')
     * @returns {Object} CSS style object
     */
    glassStyle(variant = 'card') {
      return {
        ...liquidGlassStyle({
          vuetifyTheme: this.theme,
          opacity: this.config.vuetify.theme.header?.opacity,
          variant,
          border: 'none',
          extras: {
            color: this.theme.current.colors.onSurface,
          },
        }),
        ...(variant === 'header' ? colorModeStyle(this.config.vuetify.theme.header?.colorMode) : {}),
      };
    },
    navigate(link) {
      if (link.startsWith('http')) {
        window.open(link, '_blank');
      } else {
        this.$router.push(link);
      }
    },
    bottomRounded(inputString) {
      if (inputString.endsWith('-b')) return inputString;
      const lastIndex = inputString.lastIndexOf('-');
      if (lastIndex !== -1) return `${inputString.slice(0, lastIndex + 1)}b-${inputString.slice(lastIndex + 1)}`;
      return `${inputString}-b`;
    },
  },
};
</script>

<style scoped>
.devkit-app-bar :deep(.v-toolbar__content)::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.8) 0%,
    rgba(255, 255, 255, 0.4) 40%,
    rgba(255, 255, 255, 0.2) 50%,
    rgba(255, 255, 255, 0.3) 60%,
    rgba(255, 255, 255, 0.8) 100%
  );
  pointer-events: none;
  transition: opacity 0.35s ease;
}

/* Float mode: smooth transitions on the app-bar — width animates progressively from both sides */
.devkit-app-bar--float {
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1), border-radius 0.5s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.5s cubic-bezier(0.4, 0, 0.2, 1), top 0.5s cubic-bezier(0.4, 0, 0.2, 1), background 0.5s cubic-bezier(0.4, 0, 0.2, 1), color 0.5s cubic-bezier(0.4, 0, 0.2, 1), backdrop-filter 0.5s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

/* When scrolled in float mode: nudge down and hide the bottom gradient line */
.devkit-app-bar--scrolled {
  top: 12px !important;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08) !important;
}

.devkit-app-bar--scrolled :deep(.v-toolbar__content)::after {
  opacity: 0;
}

/* Force text color inheritance through Vuetify toolbar internals */
.devkit-app-bar--float :deep(.v-toolbar__content),
.devkit-app-bar--float :deep(.v-toolbar__content) .v-btn,
.devkit-app-bar--float :deep(.v-toolbar__content) a {
  color: inherit !important;
}

@media (prefers-reduced-motion: reduce) {
  .devkit-app-bar--float {
    transition: none !important;
  }

  .devkit-app-bar :deep(.v-toolbar__content)::after {
    transition: none !important;
  }
}
</style>

<style>
/* Global styles for teleported menu elements */
.gradient-border-menu {
  position: relative;
}

.gradient-border-menu::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.4) 50%, rgba(255, 255, 255, 0.9) 100%);
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}
</style>
