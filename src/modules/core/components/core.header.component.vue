<template>
  <v-app-bar
    v-if="!isLoggedIn"
    :style="headerStyle"
    :flat="config.vuetify.theme.flat"
    :scroll-behavior="config.vuetify.theme.header?.scrollBehavior"
    class="waos-app-bar"
  >
    <v-container :style="{ maxWidth: config.vuetify.theme.maxWidth }" class="d-flex align-center pa-0">
      <!-- Logo/Title -->
      <router-link v-if="config.header.logo.file" to="/">
        <v-img :src="config.header.logo.file" height="100px" width="100px" class="ml-0 mt-2" inline alt="logo"> </v-img>
      </router-link>
      <router-link v-if="config.header.title" to="/">
        <h2 class="mr-2">{{ config.app.title }}</h2>
      </router-link>
      <!-- Menu -->
      <span v-for="({ title, url, sublinks }, i) in config.header.links" :key="i" class="hidden-sm-and-down">
        <v-btn v-if="!sublinks" class="text-none text-body-2" @click="navigate(url)">
          {{ title }}
        </v-btn>
        <v-menu v-if="sublinks" location="bottom" max-width="400px">
          <template #activator="{ props }">
            <v-btn v-bind="props" class="text-none text-body-2">
              {{ title }}
              <v-icon class="mt-1 ml-2" size="x-small">fa-solid fa-angle-down</v-icon>
            </v-btn>
          </template>
          <v-list lines="two" class="px-0 py-0 mt-6 gradient-border-menu" :class="config.vuetify.theme.rounded" :style="menuStyle" density="compact">
            <v-list-item
              v-for="({ icon, title: linkTitle, url: linkUrl, color, subtitle }, j) in sublinks"
              :key="j"
              class="px-6 py-3"
              @click="navigate(linkUrl)"
            >
              <template #prepend>
                <v-icon :color="color" size="small">{{ icon }}</v-icon>
              </template>
              <v-list-item-title class="text-body-2 font-weight-medium">{{ linkTitle }}</v-list-item-title>
              <v-list-item-subtitle v-if="subtitle" class="text-caption">{{ subtitle }}</v-list-item-subtitle>
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
        class="hidden-sm-and-down text-none text-body-2 mr-2"
        :class="`${config.vuetify.theme.rounded}`"
        :variant="variant"
        :style="{ color: config.vuetify.theme.themes[theme].colors.onBackground }"
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
        <v-card min-width="300px" class="gradient-border-menu" :class="config.vuetify.theme.rounded" :style="menuStyle">
          <!-- Menu -->
          <v-list density="compact">
            <v-list-item v-for="({ title, sublinks }, i) in config.header.links.filter((v) => v.sublinks)" :key="i">
              <v-list-item-title class="text-subtitle-2 font-weight-bold text-medium-emphasis">{{ title }}</v-list-item-title>
              <v-list lines="one" density="compact">
                <v-list-item v-for="({ icon, title: linkTitle, url: linkUrl, color, subtitle }, j) in sublinks" :key="j" @click="navigate(linkUrl)">
                  <template #prepend>
                    <v-icon :color="color" size="small">{{ icon }}</v-icon>
                  </template>
                  <v-list-item-title class="text-body-2 font-weight-medium">{{ linkTitle }}</v-list-item-title>
                  <v-list-item-subtitle v-if="subtitle" class="text-caption">{{ subtitle }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-list-item>
          </v-list>
          <v-divider></v-divider>
          <!-- Menu 2 -->
          <v-list class="mx-2" density="compact">
            <v-list-item v-for="({ title, url }, i) in config.header.links.filter((v) => !v.sublinks)" :key="i" @click="navigate(url)">
              <v-list-item-title class="text-body-2 font-weight-medium">{{ title }}</v-list-item-title>
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
              class="text-none text-body-2"
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
import { useCoreStore } from '../stores/core.store';
import { useAuthStore } from '../../auth/stores/auth.store';
import { liquidGlassStyle } from '../../../lib/helpers/theme';

/**
 * Component definition.
 */
export default {
  name: 'WaosAppBar',
  computed: {
    theme() {
      const coreStore = useCoreStore();
      return coreStore.theme;
    },
    isLoggedIn() {
      const authStore = useAuthStore();
      return authStore.isLoggedIn;
    },
    headerStyle() {
      const colors = this.config.vuetify.theme.themes[this.theme].colors;
      return liquidGlassStyle({
        theme: this.theme,
        backgroundColor: colors.background,
        surfaceColor: colors.surfaceColor,
        intensity: 1,
        variant: 'header',
        border: 'none',
        extras: {
          color: colors.onSurface,
          width: '100%',
        },
      });
    },
    menuStyle() {
      const colors = this.config.vuetify.theme.themes[this.theme].colors;
      return liquidGlassStyle({
        theme: this.theme,
        backgroundColor: colors.background,
        surfaceColor: colors.surfaceColor,
        intensity: 0.6,
        variant: 'card',
        border: 'none',
        extras: {
          color: colors.onSurface,
        },
      });
    },
  },
  methods: {
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
.waos-app-bar :deep(.v-toolbar__content)::after {
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
}
</style>

<style>
/* Global styles for teleported menu elements */
@property --angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}

@keyframes rotate {
  to {
    --angle: 360deg;
  }
}

.gradient-border-menu {
  position: relative;
}

.gradient-border-menu::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(var(--angle), rgba(255, 255, 255, 1), rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.4));
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
  animation: rotate 8s linear infinite;
}
</style>
