<template>
  <v-container style="max-width: 520px">
    <v-card class="mt-10 pa-8 pa-sm-10" color="surface" :flat="config.vuetify.theme.flat" :class="config.vuetify.theme.rounded">
      <h4 class="text-headline-small font-weight-bold text-center">
        {{ signupStepTitle }}
      </h4>
      <p class="text-body-medium text-medium-emphasis text-center mt-1" :class="signupStep === 'form' ? 'mb-8' : 'mb-4'">
        <template v-if="signupStep === 'form'">
          Already have an account?
          <router-link to="/signin" class="text-primary font-weight-bold text-decoration-none">Sign in</router-link>
        </template>
        <template v-else-if="signupStep === 'emailVerification'">We sent a verification link to <strong>{{ email }}</strong></template>
        <template v-else-if="signupStep === 'organizationSetup'">One last step — set up the workspace where your work will live.</template>
        <template v-else-if="signupStep === 'organizationWelcome'">{{ organizationWelcomeMessage }}</template>
      </p>

      <!-- Discrete progress bar (step 2+ only) -->
      <v-progress-linear
        v-if="signupStep !== 'form'"
        :model-value="signupProgressValue"
        color="primary"
        height="3"
        :class="config.vuetify.theme.rounded"
        class="mb-6"
      ></v-progress-linear>

      <!-- OAuth providers (only on step 1) -->
      <div v-if="signupStep === 'form' && serverConfig?.sign?.up !== false" class="d-flex flex-column ga-3 mb-6">
        <v-btn
          variant="flat"
          :href="serverConfig?.oAuth?.google ? `${oAuth}/google` : undefined"
          :disabled="!serverConfig?.oAuth?.google"
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
          variant="flat"
          :href="serverConfig?.oAuth?.apple ? `${oAuth}/apple` : undefined"
          :disabled="!serverConfig?.oAuth?.apple"
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
      <div v-if="signupStep === 'form' && serverConfig?.sign?.up !== false" class="d-flex align-center ga-4 mb-6">
        <v-divider></v-divider>
        <span class="text-label-medium text-medium-emphasis text-no-wrap">or continue with email</span>
        <v-divider></v-divider>
      </div>

      <!-- Registration disabled -->
      <v-alert v-if="serverConfig?.sign?.up === false && !invite?.valid && !inviteChecking" type="warning" variant="tonal" class="mb-4" :class="config.vuetify.theme.rounded">
        <span class="text-body-medium">Registration is currently disabled.</span>
      </v-alert>

      <!-- Email verification step -->
      <template v-else-if="signupStep === 'emailVerification'">
        <div class="d-flex flex-column align-center ga-4 my-4">
          <v-icon icon="fa-solid fa-envelope" size="x-large" color="primary"></v-icon>
          <p class="text-body-medium text-center">Check your inbox and click the verification link to continue.</p>
          <v-btn
            variant="tonal"
            color="primary"
            :class="config.vuetify.theme.rounded"
            class="text-none text-body-medium"
            :loading="resending"
            :disabled="resent"
            @click="resendVerification"
          >
            {{ resent ? 'Sent' : 'Resend' }}
          </v-btn>
        </div>
      </template>

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
      <template v-else-if="serverConfig === null || serverConfig?.sign?.up === true || invite?.valid">
        <v-alert v-if="invite?.valid" type="success" variant="tonal" class="mb-4" :class="config.vuetify.theme.rounded">
          <span class="text-body-medium">You've been invited. Create your account below.</span>
        </v-alert>
        <v-alert
          v-if="signupError"
          type="error"
          variant="tonal"
          closable
          class="mb-4"
          :class="config.vuetify.theme.rounded"
          @click:close="signupError = null"
        >
          {{ signupError }}
        </v-alert>
        <v-form ref="form" v-model="valid">
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
            :type="showPassword ? 'text' : 'password'"
            :rules="[rules.password]"
            :append-inner-icon="showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"
            placeholder="Create a password"
            variant="outlined"
            density="comfortable"
            class="mb-6"
            required
            hide-details="auto"
            @click:append-inner="showPassword = !showPassword"
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
      </template>
    </v-card>
  </v-container>
</template>

<script>
/**
 * Module dependencies.
 */
import { useTheme } from 'vuetify';
import { useAuthStore, deduceNamesFromEmail } from '../stores/auth.store';
import AuthOrganizationSetupComponent from '../components/organizationSetup.component.vue';
/**
 * Component definition.
 */
export default {
  components: {
    AuthOrganizationSetupComponent,
  },
  /**
   * @desc Initialize signup view reactive state including form fields, OAuth URL,
   * validation rules, and signupError for API error display.
   * @returns {Object} Component reactive data.
   */
  data() {
    const theme = useTheme();
    return {
      theme,
      valid: false,
      serverConfig: undefined,
      inviteToken: (() => { const q = this.$route.query.inviteToken; return (Array.isArray(q) ? q[0] : q) || null; })(),
      inviteChecking: !!((() => { const q = this.$route.query.inviteToken; return (Array.isArray(q) ? q[0] : q) || null; })()),
      invite: null, // { valid, email } once verified
      signupStep: 'form',
      organizationWelcomeMessage: '',
      suggestedOrganization: null,
      resending: false,
      resent: false,
      email: '',
      password: '',
      signupError: null,
      showPassword: false,
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
     * @desc Compute the signup step title based on the current step.
     * @returns {string} Title for the current signup step.
     */
    signupStepTitle() {
      switch (this.signupStep) {
        case 'emailVerification':
          return 'Check your inbox';
        case 'organizationSetup':
          return 'Set up your workspace';
        case 'organizationWelcome':
          return "You're all set!";
        default:
          return 'Create your account';
      }
    },
    /**
     * @desc Compute the progress bar value based on the current step.
     * @returns {number} Progress percentage.
     */
    signupProgressValue() {
      switch (this.signupStep) {
        case 'emailVerification':
          return 50;
        case 'organizationSetup':
          return 66;
        case 'organizationWelcome':
          return 100;
        default:
          return 33;
      }
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
          this.pushAfterAuth();
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
    if (this.inviteToken) {
      this.invite = await authStore.verifyInvite(this.inviteToken);
      if (this.invite?.valid && this.invite.email) this.email = this.invite.email;
      this.inviteChecking = false;
    }
    // If already logged in (e.g. page refresh after signup), redirect appropriately
    if (authStore.isLoggedIn) {
      if (authStore.user?.currentOrganization) {
        this.pushAfterAuth();
      } else if (this.serverConfig?.organizations?.enabled) {
        this.$router.push('/organization-required');
      }
    }
  },
  methods: {
    /**
     * @desc Navigate to the post-auth destination. Honors ?redirect= when it's a
     * same-origin path (starts with '/') — used by the pricing page CTA to bring
     * the user back to pricing after signup. Falls back to config.sign.route.
     * Matches signin.view.vue's redirect-honor pattern.
     * @returns {void}
     */
    pushAfterAuth() {
      const redirect = this.$route.query.redirect;
      this.$router.push(typeof redirect === 'string' && redirect.startsWith('/') ? redirect : this.config.sign.route);
    },
    /**
     * @desc Validate and submit the signup form, then handle organization flow.
     * Names are deduced from email in the store's signup action.
     * @returns {Promise<void>}
     */
    async validate() {
      this.signupError = null;
      const form = await this.$refs.form.validate();
      if (form.valid) {
        const authStore = useAuthStore();
        try {
          const result = await authStore.signup({
            email: this.email,
            password: this.password,
            ...(this.inviteToken ? { inviteToken: this.inviteToken } : {}),
          });

          if (!result) return;

          // Email verification required — pause before org setup
          if (result.emailVerificationRequired) {
            this.signupStep = 'emailVerification';
            return;
          }

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
              this.pushAfterAuth();
            }
          } else {
            // Organizations not enabled — proceed as usual
            this.pushAfterAuth();
          }
        } catch (err) {
          this.signupError = this.signupErrorMessage(err);
        }
      }
    },
    /**
     * @desc Resolve an API signup failure to a short user-facing message.
     * @param {Error & { response?: { data?: object|string } }} error
     * @returns {string}
     */
    signupErrorMessage(error) {
      const data = error?.response?.data;
      if (typeof data === 'string' && data.trim()) return data;
      // The API error envelope carries the precise reason in `description`
      // (e.g. signup disabled) while `message` is often generic — prefer it.
      if (typeof data?.description === 'string' && data.description.trim()) return data.description;
      if (typeof data?.message === 'string' && data.message.trim()) return data.message;
      if (typeof data?.error === 'string' && data.error.trim()) return data.error;
      if (Array.isArray(data?.errors) && data.errors.length > 0) {
        return data.errors
          .map((entry) => entry?.message || entry?.msg || entry?.error || (typeof entry === 'string' ? entry : 'An unknown error occurred'))
          .filter(Boolean)
          .join(' ');
      }
      return 'Unable to create your account. Please try again.';
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
        this.pushAfterAuth();
      }
    },
    /**
     * @desc Resend the verification email to the user.
     * @returns {Promise<void>}
     */
    async resendVerification() {
      this.resending = true;
      const authStore = useAuthStore();
      try {
        await authStore.resendVerification();
        this.resent = true;
      } catch {
        // silently handle — button stays enabled for retry
      } finally {
        this.resending = false;
      }
    },
    reset() {
      this.$refs.form.reset();
    },
  },
};
</script>
