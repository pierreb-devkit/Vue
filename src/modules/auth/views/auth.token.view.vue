<template>
  <v-container :style="`max-width: ${config.vuetify.theme.maxWidth}`">
    <v-row align="start" justify="center">
      <v-card class="mt-8 pa-8" width="100%" :style="{ background: theme.current.colors.surface }" :flat="config.vuetify.theme.flat">
        <v-col cols="12">
          <h4>Error during oAuth</h4>
          <v-divider></v-divider>
        </v-col>
        <v-container>
          <v-alert type="error" color="error">
            <b>{{ $route.query.message }}</b> : {{ error.details.message }}
            <span v-for="(key, i) in Object.keys(error.details.errors)" :key="i">{{ error.details.errors[key].message }}</span>
          </v-alert>
          <br />
          <p>
            Back to
            <b>
              <router-link to="/signin">Sign In</router-link>
            </b>
            or
            <b>
              <router-link to="/signup">Sign Up</router-link>
            </b>
            !
          </p>
        </v-container>
      </v-card>
    </v-row>
  </v-container>
</template>

<script>
/**
 * Module dependencies.
 */
import { useTheme } from 'vuetify';
import { useAuthStore } from '../stores/auth.store';
/**
 * Component definition.
 */
export default {
  data() {
    const theme = useTheme();
    return {
      theme,
      error: '',
    };
  },
  computed: {
    themeName() {
      return this.theme.name;
    },
  },
  async created() {
    if (!this.$route.query.message) {
      const authStore = useAuthStore();
      try {
        await authStore.token(this);
        this.$router.push(this.config.sign.route);
      } catch (err) {
        console.log(err);
      }
    } else {
      this.error = JSON.parse(this.$route.query.error);
      console.log(this.error);
    }
  },
};
</script>
