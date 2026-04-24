<template>
  <v-container :style="`max-width: ${config.vuetify.theme.maxWidth}`">
    <v-row align="start" justify="center">
      <v-card class="mt-8 pa-8" width="100%" :style="{ background: theme.current.colors.surface }" :flat="config.vuetify.theme.flat">
        <template v-if="loading">
          <v-col cols="12" class="text-center py-8">
            <v-progress-circular indeterminate color="primary" size="48" />
            <p class="mt-4">Signing you in…</p>
          </v-col>
        </template>
        <template v-else>
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
        </template>
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
import { createLogger } from '../../../lib/helpers/logger';

const logger = createLogger('auth');
/**
 * Component definition.
 */
export default {
  data() {
    const theme = useTheme();
    return {
      theme,
      loading: true,
      error: { details: { message: '', errors: {} } },
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
        await authStore.token();
        this.$router.push(this.config.sign.route);
      } catch (err) {
        logger.error(err);
        this.error = {
          details: {
            message: err?.message || 'Failed to complete sign-in',
            errors: {},
          },
        };
        this.loading = false;
      }
    } else {
      try {
        const parsed = JSON.parse(this.$route.query.error);
        const message = typeof parsed?.details?.message === 'string' ? parsed.details.message : 'An unexpected error occurred';
        const rawErrors = parsed?.details?.errors;
        const errors = {};
        if (rawErrors && typeof rawErrors === 'object' && !Array.isArray(rawErrors)) {
          Object.keys(rawErrors).forEach((key) => {
            if (rawErrors[key] && typeof rawErrors[key].message === 'string') {
              errors[key] = { message: rawErrors[key].message };
            }
          });
        }
        this.error = { details: { message, errors } };
      } catch (parseErr) {
        logger.error('Failed to parse OAuth error query param:', parseErr);
        this.error = { details: { message: 'An unexpected error occurred', errors: {} } };
      }
      logger.error('OAuth error:', this.error);
      this.loading = false;
    }
  },
};
</script>
