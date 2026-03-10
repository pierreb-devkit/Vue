<template>
  <v-container :style="`max-width: ${config.vuetify.theme.maxWidth}`">
    <v-row align="start" justify="center">
      <v-card class="mt-8 pa-8" width="100%" color="surface" :flat="config.vuetify.theme.flat" :class="config.vuetify.theme.rounded">
        <v-col cols="12">
          <h4 class="text-headline-small font-weight-bold">Sign Up</h4>
          <v-divider class="mt-3"></v-divider>
        </v-col>
        <v-container>
          <!-- Registration disabled -->
          <v-alert v-if="serverConfig?.sign?.up === false" type="warning" variant="tonal" class="mb-4" :class="config.vuetify.theme.rounded">
            <span class="text-body-medium">Registration is currently disabled.</span>
          </v-alert>

          <!-- Organization welcome message (auto-created/joined) -->
          <template v-else-if="signupStep === 'organizationWelcome'">
            <v-alert type="success" variant="tonal" class="mb-6" prominent :class="config.vuetify.theme.rounded">
              <span class="text-body-large font-weight-medium">
                {{ organizationWelcomeMessage }}
              </span>
            </v-alert>
            <v-row justify="center">
              <v-btn color="primary" variant="flat" :class="config.vuetify.theme.rounded" class="text-none text-body-medium" @click="proceedToApp">
                Get Started
              </v-btn>
            </v-row>
          </template>

          <!-- Organization setup step (manual creation required) -->
          <template v-else-if="signupStep === 'organizationSetup'">
            <AuthOrganizationSetupComponent @created="onOrganizationCreated" />
          </template>

          <!-- Standard signup form -->
          <v-form v-else-if="serverConfig === null || serverConfig?.sign?.up === true" ref="form" v-model="valid">
            <v-row>
              <v-col cols="12" md="6" sm="6" class="py-0 my-0">
                <v-text-field v-model="firstName" :rules="[rules.firstName]" label="Firstname" prepend-icon="fa-solid fa-user" variant="outlined" density="comfortable" required></v-text-field>
              </v-col>
              <v-col cols="12" md="6" sm="6" class="py-0 my-0">
                <v-text-field v-model="lastName" :rules="[rules.lastName]" label="Lastname" variant="outlined" density="comfortable" required></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="email"
                  :rules="[rules.required, rules.mail]"
                  label="E-mail"
                  prepend-icon="fa-solid fa-envelope"
                  variant="outlined"
                  density="comfortable"
                  required
                ></v-text-field>
                <v-text-field
                  v-model="password"
                  :type="'password'"
                  :rules="[rules.password]"
                  label="Password"
                  prepend-icon="fa-solid fa-key"
                  variant="outlined"
                  density="comfortable"
                  required
                ></v-text-field>
              </v-col>
            </v-row>
            <v-row align="center">
              <v-col cols="12" sm="6" class="d-flex align-center flex-wrap ga-2">
                <v-btn
                  :flat="config.vuetify.theme.flat"
                  :disabled="!valid"
                  color="primary"
                  variant="flat"
                  :class="config.vuetify.theme.rounded"
                  class="text-none text-body-medium"
                  @click="validate"
                >
                  Sign Up
                </v-btn>
                <v-btn
                  v-if="config.oAuth.google"
                  variant="outlined"
                  color="secondary"
                  :href="`${oAuth}/google`"
                  :class="config.vuetify.theme.rounded"
                  icon
                  size="small"
                >
                  <v-icon icon="fab fa-google"></v-icon>
                </v-btn>
                <v-btn
                  v-if="config.oAuth.apple"
                  variant="outlined"
                  color="secondary"
                  :href="`${oAuth}/apple`"
                  :class="config.vuetify.theme.rounded"
                  icon
                  size="small"
                >
                  <v-icon icon="fab fa-apple"></v-icon>
                </v-btn>
              </v-col>
              <v-col cols="12" sm="6" class="text-sm-right">
                <v-btn
                  variant="text"
                  class="text-none text-body-medium"
                  @click="reset"
                >
                  Reset Form
                </v-btn>
              </v-col>
            </v-row>
          </v-form>
          <p class="text-body-medium mt-6">
            <router-link to="/signin" class="text-primary font-weight-bold text-decoration-none">Sign In</router-link>
            if you already have an account.
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
import AuthOrganizationSetupComponent from '../components/auth.organizationSetup.component.vue';
/**
 * Component definition.
 */
export default {
  components: {
    AuthOrganizationSetupComponent,
  },
  data() {
    const theme = useTheme();
    return {
      theme,
      valid: true, // TODO: switch to false when forms will be reactive
      serverConfig: undefined,
      signupStep: 'form',
      organizationWelcomeMessage: '',
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      oAuth: `${this.config.api.protocol}://
      ${this.config.api.host}:${this.config.api.port}/
      ${this.config.api.base}/${this.config.api.endPoints.auth}`,
      rules: {
        firstName: (v) => !!v || 'Firstname is required',
        lastName: (v) => !!v || 'Lastname is required',
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
    themeName() {
      return this.theme.name;
    },
  },
  watch: {
    auth(auth) {
      if (auth && this.signupStep === 'form') {
        // Only auto-redirect if no org step is pending
        if (!this.serverConfig?.organizations?.enabled) {
          this.$router.push(this.config.sign.route);
        }
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
  methods: {
    /**
     * @desc Validate and submit the signup form, then handle organization flow.
     * @returns {Promise<void>}
     */
    async validate() {
      const form = await this.$refs.form.validate();
      if (form.valid) {
        const authStore = useAuthStore();
        try {
          const result = await authStore.signup({
            email: this.email,
            password: this.password,
            firstName: this.firstName,
            lastName: this.lastName,
          });

          if (!result) return;

          // Check if organizations are enabled in server config
          if (this.serverConfig?.organizations?.enabled) {
            if (result.organization) {
              // Backend auto-created or auto-joined an organization
              const organizationName = result.organization.name || result.organization.slug || 'your organization';
              this.organizationWelcomeMessage = result.organization.joined
                ? `Welcome! You've joined ${organizationName}.`
                : `Welcome! Your organization "${organizationName}" has been created.`;
              this.signupStep = 'organizationWelcome';
            } else if (result.organizationSetupRequired) {
              // Manual organization setup needed
              this.signupStep = 'organizationSetup';
            } else {
              // Organizations enabled but no setup needed — proceed normally
              this.$router.push(this.config.sign.route);
            }
          } else {
            // Organizations not enabled — proceed as usual
            this.$router.push(this.config.sign.route);
          }
        } catch (err) {
          console.log(err);
        }
      }
    },
    /**
     * @desc Handle successful organization creation from the setup component.
     * @param {Object} organization - The created organization object
     * @returns {void}
     */
    onOrganizationCreated(organization) {
      this.organizationWelcomeMessage = `Welcome! Your organization "${organization.name}" has been created.`;
      this.signupStep = 'organizationWelcome';
    },
    /**
     * @desc Navigate to the main application after signup and org setup.
     * @returns {void}
     */
    proceedToApp() {
      this.$router.push(this.config.sign.route);
    },
    reset() {
      this.$refs.form.reset();
    },
  },
};
</script>
