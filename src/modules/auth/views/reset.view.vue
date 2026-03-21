<template>
  <v-container style="max-width: 520px">
    <v-card class="mt-10 pa-8 pa-sm-10" color="surface" :flat="config.vuetify.theme.flat" :class="config.vuetify.theme.rounded">
      <h4 class="text-headline-small font-weight-bold text-center">Reset your password</h4>
      <p class="text-body-medium text-medium-emphasis text-center mt-1 mb-8">
        Enter your new password below.
      </p>
      <v-form ref="form" v-model="valid">
        <label class="text-label-large font-weight-medium d-block mb-1">New password</label>
        <v-text-field
          v-model="password"
          :type="showPassword ? 'text' : 'password'"
          :rules="[rules.password]"
          :append-inner-icon="showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"
          placeholder="Enter your new password"
          variant="outlined"
          density="comfortable"
          class="mb-6"
          required
          hide-details="auto"
          @click:append-inner="showPassword = !showPassword"
        ></v-text-field>
        <v-btn
          :flat="config.vuetify.theme.flat"
          :disabled="!valid"
          color="primary"
          variant="flat"
          :class="config.vuetify.theme.rounded"
          class="text-none text-body-medium"
          size="large"
          block
          @click="validate"
        >
          Save Password
        </v-btn>
      </v-form>
      <p class="text-body-medium text-center mt-6">
        <router-link to="/signin" class="text-primary font-weight-bold text-decoration-none">Back to sign in</router-link>
      </p>
    </v-card>
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
      password: '',
      showPassword: false,
      rules: {
        required: (v) => !!v || 'Required',
        mail: (v) => /\S+@\S+\.\S+/.test(v) || 'E-mail must be valid',
        password: (v) => (v && v.length >= 8) || 'Password must be at least 8 characters',
      },
    };
  },
  computed: {
    themeName() {
      return this.theme.name;
    },
    mail() {
      const authStore = useAuthStore();
      return authStore.mail;
    },
  },
  methods: {
    async validate() {
      const form = await this.$refs.form.validate();
      if (form.valid) {
        const { password } = this;
        const authStore = useAuthStore();
        try {
          await authStore.reset({ newPassword: password, token: this.$route.query.token });
          this.$router.push(this.config.sign.route);
        } catch (err) {
          console.log(err);
        }
      }
    },
    reset() {
      this.$refs.form.reset();
    },
  },
};
</script>
