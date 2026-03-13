<template>
  <v-container style="max-width: 520px">
    <v-card class="mt-10 pa-8 pa-sm-10" color="surface" :flat="config.vuetify.theme.flat" :class="config.vuetify.theme.rounded">
      <h4 class="text-headline-small font-weight-bold text-center">Forgot password?</h4>
      <p class="text-body-medium text-medium-emphasis text-center mt-1 mb-8">
        Enter your email and we'll send you a reset link.
      </p>
      <v-form ref="form" v-model="valid">
        <label class="text-label-large font-weight-medium d-block mb-1">Email address</label>
        <v-text-field
          v-model="email"
          :rules="[rules.required, rules.mail]"
          placeholder="name@example.com"
          variant="outlined"
          density="comfortable"
          class="mb-6"
          required
          hide-details="auto"
        ></v-text-field>
        <v-btn
          :flat="config.vuetify.theme.flat"
          :disabled="!valid || mail.status"
          color="primary"
          variant="flat"
          :class="config.vuetify.theme.rounded"
          class="text-none text-body-medium"
          size="large"
          block
          @click="validate"
        >
          Send Reset Link
        </v-btn>
      </v-form>
      <v-alert v-if="mail.message" type="success" variant="tonal" class="mt-6" :class="config.vuetify.theme.rounded">
        {{ mail.message }}
      </v-alert>
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
import { useAuthStore } from '../../stores/auth.store';
/**
 * Component definition.
 */
export default {
  data() {
    const theme = useTheme();
    return {
      theme,
      valid: true, // TODO: switch to false when forms will be reactive
      email: '',
      rules: {
        required: (v) => !!v || 'Required',
        mail: (v) => /\S+@\S+\.\S+/.test(v) || 'E-mail must be valid',
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
        const { email } = this;
        const authStore = useAuthStore();
        try {
          await authStore.forgot({ email });
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
