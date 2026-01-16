<template>
  <v-container :style="`max-width: ${config.vuetify.theme.maxWidth}`">
    <v-row align="start" justify="center">
      <v-card
        class="mt-8 pa-8"
        width="100%"
        :style="{ background: config.vuetify.theme.themes[themeName].colors.surface }"
        :flat="config.vuetify.theme.flat"
      >
        <v-col cols="12">
          <h4>Reset</h4>
          <v-divider></v-divider>
        </v-col>
        <v-container>
          <v-form ref="form" v-model="valid">
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="password"
                  :type="'password'"
                  :rules="[rules.password]"
                  label="New password"
                  prepend-icon="fa fa-key"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-btn :flat="config.vuetify.theme.flat" :disabled="!valid" color="success" class="mr-4" @click="validate">Validate</v-btn>
                <v-btn :flat="config.vuetify.theme.flat" color="error" class="mr-4" @click="reset">Reset Form</v-btn>
              </v-col>
            </v-row>
          </v-form>
          <br />
          <p v-if="config.sign.up">
            <b>
              <router-link to="/signin">Back</router-link>
            </b>
            to sign in !
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
      password: '',
      rules: {
        required: (v) => !!v || 'Required',
        mail: (v) => /\S+@\S+\.\S+/.test(v) || 'E-mail must be valid',
      },
    };
  },
  computed: {
    themeName() {
      return this.theme.global.name.value;
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
          await authStore.reset(this, { newPassword: password, token: this.$route.query.token });
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
