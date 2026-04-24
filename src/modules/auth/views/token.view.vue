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
              <b>{{ $route.query.message || 'Sign-in failed' }}</b> : {{ error.details.message }}
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
  /**
   * OAuth callback handler. When no route query.message is present, exchange the
   * authorization code for a session token and redirect to the post-sign route.
   * When an error message is present, parse the tolerant `error` query payload —
   * canonical `description`, legacy `details.message`, top-level `message`, or
   * plain string (older backend wire shape, issue #4021) — for display.
   * @returns {Promise<void>}
   */
  async created() {
    if (!this.$route.query.message) {
      const authStore = useAuthStore();
      try {
        await authStore.token();
        try {
          await this.$router.push(this.config.sign.route);
        } catch (navErr) {
          logger.error(navErr);
          this.error = {
            details: {
              message: navErr?.message || 'Failed to redirect after sign-in',
              errors: {},
            },
          };
          this.loading = false;
        }
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
      const raw = this.$route.query.error;
      const FALLBACK = 'An unexpected error occurred';
      /**
       * Return `value` if it is a non-empty string, otherwise `undefined`.
       * @param {*} value - Candidate value to type-check.
       * @returns {string|undefined} The string, or undefined when not usable.
       */
      const asNonEmptyString = (value) => (typeof value === 'string' && value.length > 0 ? value : undefined);
      let details = { message: FALLBACK, errors: {} };
      try {
        const parsed = JSON.parse(raw);
        // Prefer canonical `description`, then legacy `details.message`, then top-level `message`.
        // Each candidate must itself be a non-empty string — never surface the raw JSON body.
        const msg = asNonEmptyString(parsed?.description)
          || asNonEmptyString(parsed?.details?.message)
          || asNonEmptyString(parsed?.message)
          || FALLBACK;
        const rawErrors = parsed?.details?.errors;
        const errors = {};
        if (rawErrors && typeof rawErrors === 'object' && !Array.isArray(rawErrors)) {
          Object.keys(rawErrors).forEach((key) => {
            if (rawErrors[key] && typeof rawErrors[key].message === 'string') {
              errors[key] = { message: rawErrors[key].message };
            }
          });
        }
        details = { message: msg, errors };
      } catch {
        // Older backend shape: `error` query param is a plain (non-JSON) string.
        // Vue's `{{ }}` interpolation auto-escapes HTML, so this is safe to render.
        const plain = asNonEmptyString(raw);
        if (plain) details = { message: plain, errors: {} };
      }
      this.error = { details };
      logger.error('OAuth error:', this.error);
      this.loading = false;
    }
  },
};
</script>
