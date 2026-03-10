<template>
  <v-container :style="`max-width: ${config.vuetify.theme.maxWidth}`">
    <v-row align="start" justify="center">
      <v-card class="mt-8 pa-8" width="100%" :style="{ background: theme.current.colors.surface }" :flat="config.vuetify.theme.flat">
        <v-col cols="12">
          <h4>Sign In</h4>
          <v-divider></v-divider>
        </v-col>
        <v-container>
          <v-alert v-if="serverConfig?.sign?.in === false" type="warning" class="mb-4">Sign in is currently disabled.</v-alert>
          <v-alert v-if="lockout.locked" type="error" class="mb-4">
            Account locked. Try again in {{ lockoutMinutes }} minute{{ lockoutMinutes !== 1 ? 's' : '' }}.
          </v-alert>
          <v-form v-else-if="serverConfig === null || serverConfig?.sign?.in === true" ref="form" v-model="valid">
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="email"
                  :rules="[rules.required, rules.mail]"
                  label="E-mail"
                  prepend-icon="fa fa-envelope"
                  required
                ></v-text-field>
                <v-text-field
                  v-model="password"
                  :type="'password'"
                  :rules="[rules.password]"
                  label="Password"
                  prepend-icon="fa fa-key"
                  required
                ></v-text-field>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="6">
                <!-- TODO fix diabled <v-btn :disabled="!valid" color="success" class="mr-4" @click="validate">Validate</v-btn> -->
                <v-btn :flat="config.vuetify.theme.flat" :disabled="lockout.locked" color="success" class="mr-4" @click="validate">Validate</v-btn>
                <v-btn v-if="config.oAuth.google" variant="outlined" color="secondary" :href="`${oAuth}/google`" class="text-white mr-4 blue"
                  ><v-icon icon="fab fa-google"></v-icon>
                </v-btn>
                <v-btn v-if="config.oAuth.apple" variant="outlined" color="secondary" :href="`${oAuth}/apple`" class="text-white mr-4 grey darken-2"
                  ><v-icon icon="fab fa-apple"></v-icon>
                </v-btn>
              </v-col>
              <v-col cols="6" class="text-right">
                <v-btn :flat="config.vuetify.theme.flat" color="error" class="mr-4" @click="reset">Reset Form</v-btn>
              </v-col>
            </v-row>
          </v-form>
          <br />
          <p v-if="config.sign.up">
            <b>
              <router-link to="/signup">Sign Up</router-link>
            </b>
            if you don't have an account yet :) ! or maybe
            <b>
              <router-link to="/forgot">reset</router-link>
            </b>
            your password ?
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
      valid: true, // TODO: switch to false when forms will be reactive
      serverConfig: undefined,
      email: '',
      password: '',
      lockoutTimer: null,
      oAuth: `${this.config.api.protocol}://
      ${this.config.api.host}:${this.config.api.port}
      /${this.config.api.base}/${this.config.api.endPoints.auth}`,
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
