<template>
  <v-container style="max-width: 520px">
    <v-card class="mt-10 pa-8 pa-sm-10" color="surface" :flat="config.vuetify.theme.flat" :class="config.vuetify.theme.rounded">
      <h4 class="text-headline-small font-weight-bold text-center">
        {{ signupStep === 'organizationSetup' ? 'Set up your organization' : signupStep === 'organizationWelcome' ? 'You\'re all set!' : 'Create your account' }}
      </h4>
      <p class="text-body-medium text-medium-emphasis text-center mt-1" :class="signupStep === 'form' ? 'mb-8' : 'mb-4'">
        <template v-if="signupStep === 'form'">
          Already have an account?
          <router-link to="/signin" class="text-primary font-weight-bold text-decoration-none">Sign in</router-link>
        </template>
        <template v-else-if="signupStep === 'organizationSetup'">Almost there — join or create your workspace.</template>
        <template v-else-if="signupStep === 'organizationWelcome'">{{ organizationWelcomeMessage }}</template>
      </p>

      <!-- Discrete progress bar (step 2+ only) -->
      <v-progress-linear
        v-if="serverConfig?.organizations?.enabled && signupStep !== 'form'"
        :model-value="signupStep === 'organizationSetup' ? 66 : 100"
        color="primary"
        height="3"
        :class="config.vuetify.theme.rounded"
        class="mb-6"
      ></v-progress-linear>

      <!-- OAuth providers (only on step 1) -->
      <div v-if="(config.oAuth.google || config.oAuth.apple) && signupStep === 'form'" class="d-flex flex-column ga-3 mb-6">
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

      <!-- Divider (only on step 1) -->
      <div v-if="(config.oAuth.google || config.oAuth.apple) && signupStep === 'form'" class="d-flex align-center ga-4 mb-6">
        <v-divider></v-divider>
        <span class="text-label-medium text-medium-emphasis text-no-wrap">or continue with email</span>
        <v-divider></v-divider>
      </div>

      <!-- Registration disabled -->
      <v-alert v-if="serverConfig?.sign?.up === false" type="warning" variant="tonal" class="mb-4" :class="config.vuetify.theme.rounded">
        <span class="text-body-medium">Registration is currently disabled.</span>
      </v-alert>

      <!-- Organization welcome -->
      <template v-else-if="signupStep === 'organizationWelcome'">
        <v-btn color="primary" variant="flat" :class="config.vuetify.theme.rounded" class="text-none text-body-medium" size="large" block @click="proceedToApp">
          Get Started
        </v-btn>
      </template>

      <!-- Organization setup -->
      <template v-else-if="signupStep === 'organizationSetup'">
        <AuthOrganizationSetupComponent
          :default-name="deducedFirstName"
          :suggested-organization="suggestedOrganization"
          @created="onOrganizationCreated"
          @request-sent="onJoinRequestSent"
        />
      </template>

      <!-- Credentials form -->
      <v-form v-else-if="serverConfig === null || serverConfig?.sign?.up === true" ref="form" v-model="valid">
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
          placeholder="Create a password"
          variant="outlined"
          density="comfortable"
          class="mb-6"
          required
          hide-details="auto"
        ></v-text-field>
        <v-btn
          :flat="config.vuetify.theme.flat"
          :disabled="valid !== true"
          color="primary"
          variant="flat"
          :class="config.vuetify.theme.rounded"
          class="text-none text-body-medium"
          size="large"
          block
          @click="validate"
        >
          Continue
        </v-btn>
      </v-form>
    </v-card>
  </v-container>
</template>

<script>
/**
 * Module dependencies.
 */
import { useTheme } from 'vuetify';
import { useAuthStore, deduceNamesFromEmail } from '../../stores/auth.store';
import AuthOrganizationSetupComponent from '../components/organizationSetup.component.vue';
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
      valid: false,
      serverConfig: undefined,
      signupStep: 'form',
      organizationWelcomeMessage: '',
      suggestedOrganization: null,
      email: '',
      password: '',
      oAuth: `${this.config.api.protocol}://
      ${this.config.api.host}:${this.config.api.port}/
      ${this.config.api.base}/${this.config.api.endPoints.auth}`,
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
     * @desc Deduce first name from the email for org name pre-fill.
     * @returns {string} Deduced first name or empty string.
     */
    deducedFirstName() {
      const { firstName } = deduceNamesFromEmail(this.email);
      return firstName;
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
    // If already logged in (e.g. page refresh after signup), redirect appropriately
    if (authStore.isLoggedIn) {
      if (authStore.user?.currentOrganization) {
        this.$router.push(this.config.sign.route);
      } else if (this.serverConfig?.organizations?.enabled) {
        this.$router.push('/organization-required');
      }
    }
  },
  methods: {
    /**
     * @desc Validate and submit the signup form, then handle organization flow.
     * Names are deduced from email in the store's signup action.
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
          });

          if (!result) return;

          // Check if organizations are enabled in server config
          if (this.serverConfig?.organizations?.enabled) {
            if (result.pendingJoin && result.organization) {
              // Domain matched — pending join request sent to admin
              const organizationName = result.organization.name || result.organization.slug || 'the organization';
              this.organizationWelcomeMessage = `Your request to join "${organizationName}" has been sent. An admin will review it shortly.`;
              this.signupStep = 'organizationWelcome';
            } else if (result.organization) {
              // Backend auto-created an organization
              const organizationName = result.organization.name || result.organization.slug || 'your organization';
              this.organizationWelcomeMessage = `Welcome! Your organization "${organizationName}" has been created.`;
              this.signupStep = 'organizationWelcome';
            } else if (result.organizationSetupRequired) {
              // Manual organization setup needed
              this.suggestedOrganization = result.suggestedOrganization || null;
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
     * @desc Handle join request sent from the setup component.
     * @param {Object} organization - The organization the request was sent to
     * @returns {void}
     */
    onJoinRequestSent(organization) {
      this.organizationWelcomeMessage = `Your request to join "${organization.name}" has been sent. An admin will review it shortly.`;
      this.signupStep = 'organizationWelcome';
    },
    /**
     * @desc Navigate to the main application after signup and org setup.
     * @returns {void}
     */
    async proceedToApp() {
      // Refresh token/abilities after org setup to pick up new org context
      const authStore = useAuthStore();
      await authStore.refreshAbilities();
      // If user has no org yet (pending join), go to organization-required page
      if (!authStore.user?.currentOrganization && this.serverConfig?.organizations?.enabled) {
        this.$router.push('/organization-required');
      } else {
        this.$router.push(this.config.sign.route);
      }
    },
    reset() {
      this.$refs.form.reset();
    },
  },
};
</script>
