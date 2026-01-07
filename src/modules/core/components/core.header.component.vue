<template>
  <v-app-bar
    v-if="!isLoggedIn"
    :style="appBarStyle"
    :flat="config.vuetify.theme.flat"
    :scroll-behavior="config.vuetify.theme.appbar.scrollBehavior"
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
        <v-btn v-if="!sublinks" class="text-none" size="large" @click="navigate(url)">
          {{ title }}
        </v-btn>
        <v-menu v-if="sublinks" location="bottom" max-width="460px" offset="20px" transition="fade-transition">
          <template #activator="{ props }">
            <v-btn v-bind="props" class="text-none" size="large">
              {{ title }}
              <v-icon class="mt-1 ml-2" size="x-small">fa-solid fa-angle-down</v-icon>
            </v-btn>
          </template>
          <v-list lines="two" class="px-2" :class="config.vuetify.theme.rounded">
            <v-list-item v-for="({ icon, title: linkTitle, url: linkUrl, color, subtitle }, j) in sublinks" :key="j" @click="navigate(linkUrl)">
              <template #prepend>
                <v-icon :color="color">{{ icon }}</v-icon>
              </template>
              <v-list-item-title class="font-weight-bold">{{ linkTitle }}</v-list-item-title>
              <v-list-item-subtitle v-if="subtitle" style="line-height: 1.5em">{{ subtitle }}</v-list-item-subtitle>
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
        class="hidden-sm-and-down text-none mr-2"
        :class="`${config.vuetify.theme.rounded}`"
        size="large"
        :variant="variant"
        :style="{ color: config.vuetify.theme.themes[theme].colors.onBackground }"
        @click="navigate(url)"
      >
        {{ title }}
      </v-btn>
      <!-- Mobile Menu -->
      <v-menu location="bottom" offset="20px" transition="fade-transition">
        <template #activator="{ props }">
          <v-btn v-bind="props" class="hidden-md-and-up" icon>
            <v-icon :style="{ color: config.vuetify.theme.appbar.color }">fa-solid fa-bars</v-icon>
          </v-btn>
        </template>
        <v-card min-width="320px" :class="config.vuetify.theme.rounded">
          <!-- Menu -->
          <v-list>
            <v-list-item v-for="({ title, sublinks }, i) in config.header.links.filter((v) => v.sublinks)" :key="i">
              <v-list-item-title class="text-h6 font-weight-bold">{{ title }}</v-list-item-title>
              <v-list lines="one">
                <v-list-item v-for="({ icon, title: linkTitle, url: linkUrl, color, subtitle }, j) in sublinks" :key="j" @click="navigate(linkUrl)">
                  <template #prepend>
                    <v-icon :color="color">{{ icon }}</v-icon>
                  </template>
                  <v-list-item-title class="font-weight-bold">{{ linkTitle }}</v-list-item-title>
                  <v-list-item-subtitle v-if="subtitle" style="line-height: 1.5em">{{ subtitle }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-list-item>
          </v-list>
          <v-divider></v-divider>
          <!-- Menu 2 -->
          <v-list class="mx-2">
            <v-list-item v-for="({ title, url }, i) in config.header.links.filter((v) => !v.sublinks)" :key="i" @click="navigate(url)">
              <v-list-item-title class="font-weight-bold">{{ title }}</v-list-item-title>
            </v-list-item>
          </v-list>
          <v-divider></v-divider>
          <!-- Shortcut -->
          <v-list-item v-for="({ title, url, variant }, i) in config.header.shortcuts" :key="i" class="my-2">
            <v-btn
              size="large"
              :variant="variant"
              :style="{
                background: config.vuetify.theme.appbar.background,
                color: config.vuetify.theme.appbar.color,
              }"
              class="text-none"
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
    appBarStyle() {
      return {
        background: `
      linear-gradient(
        to bottom,
        rgba(255,255,255,0.055) 0%,
        rgba(255,255,255,0.035) 18%,
        rgba(255,255,255,0.020) 34%,
        rgba(0,0,0,0.040) 52%,
        rgba(0,0,0,0.025) 68%,
        rgba(0,0,0,0.014) 82%,
        rgba(0,0,0,0.000) 100%
      ),
      rgba(12,12,14,0.24)
    `,
        '-webkit-backdrop-filter': 'blur(18px) saturate(125%) contrast(110%)',
        'backdrop-filter': 'blur(18px) saturate(125%) contrast(110%)',
        borderBottom: 'none',
        boxShadow: `
      inset 0 1px 0 rgba(255,255,255,0.14),
      inset 0 -1px 0 rgba(255,255,255,0.08),
      0 10px 30px rgba(0,0,0,0.28)
    `,
        width: '100%',
        'padding-top': '0',
      };
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
