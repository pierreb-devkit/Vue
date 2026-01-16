<template>
  <div v-if="isLoggedIn">
    <!-- Mobile drawer acces -->
    <v-btn
      v-if="$vuetify.display.mobile"
      :flat="config.vuetify.theme.flat"
      icon
      :style="{
        color: config.vuetify.theme.appbar.color,
        background: `${config.vuetify.theme.appbar.background}${config.vuetify.theme.appbar.opacity}`,
        '-webkit-backdrop-filter': 'blur(8px)',
        'backdrop-filter': 'blur(8px)',
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
      :style="{ background: config.vuetify.theme.appbar.background }"
      :expand-on-hover="$vuetify.display.mobile ? false : config.vuetify.theme.navigation.drawer.expand"
      :rail="config.vuetify.theme.navigation.drawer.rail"
    >
      <!-- Logo / drawer on mobile-->
      <v-list :style="{ background: config.vuetify.theme.appbar.background, color: config.vuetify.theme.appbar.color }" nav>
        <v-list-item
          :style="{
            color: config.vuetify.theme.appbar.color,
          }"
        >
          <template #prepend>
            <v-icon
              v-if="config.app.title"
              :style="{
                color: config.vuetify.theme.appbar.color,
                opacity: 1,
              }"
              :icon="$vuetify.display.mobile ? 'nothing' : config.app.icon"
              size="large"
            ></v-icon>
          </template>
          <v-list-item-title>{{ config.app.title }}</v-list-item-title>
        </v-list-item>
      </v-list>
      <v-divider :color="config.vuetify.theme.appbar.color" :thickness="3"></v-divider>
      <!-- Navigation -->
      <v-list :style="{ background: config.vuetify.theme.appbar.background, color: config.vuetify.theme.appbar.color }" nav>
        <v-list-item v-for="item in nav" :key="item.text" :to="item.path">
          <template #prepend>
            <v-icon
              :icon="item.meta.icon"
              :style="{
                color: (item.meta.color && item.meta.color.icon) || config.vuetify.theme.appbar.color,
              }"
              size="small"
            ></v-icon>
          </template>
          <v-list-item-title>{{ item.name }}</v-list-item-title>
        </v-list-item>
      </v-list>
      <!-- End -->
      <template v-if="!config.vuetify.theme.footer" #append>
        <v-list>
          <v-list-item v-for="({ icon, label, url }, i) in config.header.socials" :key="i" :href="url">
            <template #prepend>
              <v-icon>{{ icon }}</v-icon>
            </template>
            <v-list-item-title>{{ label }}</v-list-item-title>
          </v-list-item>
        </v-list>
        <v-divider :color="config.vuetify.theme.appbar.color" :thickness="3"></v-divider>
        <!-- User -->
        <v-list>
          <v-list-item
            :style="{
              color: config.vuetify.theme.appbar.color,
            }"
            @click="signout"
          >
            <template #prepend>
              <v-icon
                :style="{
                  color: config.vuetify.theme.appbar.color,
                }"
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

/**
 * Component definition.
 */
export default {
  name: 'WaosNavigation',
  data() {
    const theme = useTheme();
    return {
      theme,
      drawer: true,
    };
  },
  computed: {
    themeName() {
      return this.theme.global.name.value;
    },
    nav() {
      const coreStore = useCoreStore();
      return coreStore.nav;
    },
    isLoggedIn() {
      const authStore = useAuthStore();
      return authStore.isLoggedIn;
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
