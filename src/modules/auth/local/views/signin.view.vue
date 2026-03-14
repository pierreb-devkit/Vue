<template>
  <v-container style="max-width: 520px">
    <v-card class="mt-10 pa-8 pa-sm-10" color="surface" :flat="config.vuetify.theme.flat" :class="config.vuetify.theme.rounded">
      <h4 class="text-headline-small font-weight-bold text-center">Sign in to your account</h4>
      <p v-if="config.sign.up" class="text-body-medium text-medium-emphasis text-center mt-1 mb-8">
        Don't have an account?
        <router-link to="/signup" class="text-primary font-weight-bold text-decoration-none">Sign up</router-link>
      </p>

      <!-- OAuth providers -->
      <div v-if="(config.oAuth.google || config.oAuth.apple) && serverConfig?.sign?.in !== false" class="d-flex flex-column ga-3 mb-6">
        <v-btn
          v-if="config.oAuth.google"
          variant="flat"
          :href="`${oAuth}/google`"
          :class="config.vuetify.theme.rounded"
          class="text-none text-body-medium text-white"
          style="background-color: #4285F4"
          size="large"
          block
        >
          <v-icon start icon="fab fa-google" size="small"></v-icon>
          Continue with Google
        </v-btn>
        <v-btn
          v-if="config.oAuth.apple"
          variant="flat"
          :href="`${oAuth}/apple`"
          :class="config.vuetify.theme.rounded"
          class="text-none text-body-medium text-white"
          style="background-color: #000000"
          size="large"
          block
        >
          <v-icon start icon="fab fa-apple" size="small"></v-icon>
          Continue with Apple
        </v-btn>
      </div>

      <!-- Divider -->
      <div v-if="(config.oAuth.google || config.oAuth.apple) && serverConfig?.sign?.in !== false" class="d-flex align-center ga-4 mb-6">
        <v-divider></v-divider>
        <span class="text-label-medium text-medium-emphasis text-no-wrap">or continue with email</span>
        <v-divider></v-divider>
      </div>

      <v-alert v-if="serverConfig?.sign?.in === false" type="warning" variant="tonal" class="mb-4" :class="config.vuetify.theme.rounded">
        <span class="text-body-medium">Sign in is currently disabled.</span>
      </v-alert>
      <v-alert v-if="lockout.locked" type="error" variant="tonal" class="mb-4" :class="config.vuetify.theme.rounded">
        <span class="text-body-medium">
          Account locked. Try again in {{ lockoutMinutes }} minute{{ lockoutMinutes !== 1 ? 's' : '' }}.
        </span>
      </v-alert>
      <v-form v-else-if="serverConfig === null || serverConfig?.sign?.in === true" ref="form" v-model="valid">
        <label class="text-label-large font-weight-medium d-block mb-1">Email address</label>
        <v-text-field
          v-model="email"
          :rules="[rules.required, rules.mail]"
          placeholder="name@example.com"
          variant="outlined"
          density="comfortable"
          class="mb-4"
          required
          hide-details="auto"
        ></v-text-field>
        <label class="text-label-large font-weight-medium d-block mb-1">Password</label>
        <v-text-field
          v-model="password"
          :type="'password'"
          :rules="[rules.password]"
          placeholder="Enter your password"
          variant="outlined"
          density="comfortable"
          class="mb-6"
          required
          hide-details="auto"
        ></v-text-field>
        <v-btn
          :flat="config.vuetify.theme.flat"
          :disabled="valid !== true || lockout.locked"
          color="primary"
          variant="flat"
          :class="config.vuetify.theme.rounded"
          class="text-none text-body-medium mb-3"
          size="large"
          block
          @click="validate"
        >
          Sign In
        </v-btn>
        <div class="text-center">
          <router-link to="/forgot" class="text-primary text-body-small text-decoration-none">Forgot password?</router-link>
        </div>
      </v-form>
    </v-card>
  </v-container>
</template>

<script>
/**
 * Module dependencies.
 */
import { useTheme } from 'vuetify';
import { useAuthStore } from '../../stores/auth.store';
/**
 * Component definition.
 */
export default {
  data() {
    const theme = useTheme();
    return {
      theme,
      valid: false,
      serverConfig: undefined,
      email: '',
      password: '',
      lockoutTimer: null,
      oAuth: `${this.config.api.protocol}://${this.config.api.host}:${this.config.api.port}/${this.config.api.base}/${this.config.api.endPoints.auth}`,
      rules: {
        required: (v) => !!v || 'Required',
        mail: (v) => /\S+@\S+\.\S+/.test(v) || 'E-mail must be valid',
        password: (v) => !!v || 'Password is required',
      },
    };
  },
  computed: {
    auth() {
      const authStore = useAuthStore();
      return authStore.auth;
    },
    /**
     * @desc Reactive lockout state from the auth store.
     * @returns {{ locked: boolean, retryAfter: number }} Current lockout status.
     */
    lockout() {
      const authStore = useAuthStore();
      return authStore.lockout;
    },
    /**
     * @desc Remaining lockout time rounded up to whole minutes.
     * @returns {number} Minutes remaining before the account unlocks.
     */
    lockoutMinutes() {
      return Math.ceil(this.lockout.retryAfter / 60);
    },
    themeName() {
      return this.theme.name;
    },
  },
  watch: {
    auth(auth) {
      if (auth) this.$router.push(this.config.sign.route);
    },
    /**
     * @desc Start a countdown timer when the account becomes locked.
     * @param {{ locked: boolean, retryAfter: number }} lockout - Updated lockout state.
     * @returns {void}
     */
    lockout(lockout) {
      if (lockout.locked && lockout.retryAfter > 0) {
        this.startLockoutCountdown(lockout.retryAfter);
      }
    },
  },
  /**
   * Fetch server auth config on component creation.
   * @returns {Promise<void>}
   */
  async created() {
    const authStore = useAuthStore();
    this.serverConfig = await authStore.fetchServerConfig();
  },
  /**
   * @desc Clear the lockout countdown timer before component destruction.
   * @returns {void}
   */
  beforeUnmount() {
    if (this.lockoutTimer) clearInterval(this.lockoutTimer);
  },
  methods: {
    async validate() {
      const form = await this.$refs.form.validate();
      if (form.valid) {
        const authStore = useAuthStore();
        try {
          await authStore.signin({
            email: this.email,
            password: this.password,
          });
        } catch (err) {
          console.log(err);
        }
      }
    },
    reset() {
      this.$refs.form.reset();
    },
    /**
     * @desc Start a countdown that decrements retryAfter every second and clears lockout when done.
     * @param {number} seconds - Total seconds to count down.
     * @returns {void}
     */
    startLockoutCountdown(seconds) {
      if (this.lockoutTimer) clearInterval(this.lockoutTimer);
      const authStore = useAuthStore();
      let remaining = seconds;
      this.lockoutTimer = setInterval(() => {
        remaining -= 1;
        if (remaining <= 0) {
          clearInterval(this.lockoutTimer);
          this.lockoutTimer = null;
          authStore.clearLockout();
        } else {
          authStore.lockout.retryAfter = remaining;
        }
      }, 1000);
    },
  },
};
</script>
