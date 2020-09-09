<template>
  <v-container fluid>
    <v-row align="start" justify="center">
      <v-card
        class="mx-6 my-3"
        outlined
        tile
        width="100%"
        :style="{ background: config.vuetify.theme.themes[theme].surface }"
        :flat="config.vuetify.theme.flat"
      >
        <v-container class="pa-10">
          <v-form ref="form" v-model="valid">
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="email"
                  :rules="[rules.required, rules.mail]"
                  label="E-mail"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-text-field
                  :type="'password'"
                  :rules="[rules.password]"
                  v-model="password"
                  label="Password"
                  required
                ></v-text-field>
              </v-col>
            </v-row>
            <v-row>
              <v-btn :disabled="!valid" color="success" class="mr-4" @click="validate"
                >Validate</v-btn
              >
              <v-btn color="error" class="mr-4" @click="reset">Reset Form</v-btn>
            </v-row>
          </v-form>
          <br />
          <p v-if="config.vuetify.theme.signup">
            <b>
              <router-link to="/signup">Sign Up</router-link>
            </b>
            if you have no account yet :) !
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
import { mapGetters } from 'vuex';
/**
 * Export default
 */
export default {
  data() {
    return {
      valid: false,
      email: '',
      password: '',
      rules: {
        required: (v) => !!v || 'Required',
        mail: (v) => /\S+@\S+\.\S+/.test(v) || 'E-mail must be valid',
        password: (v) => !!v || 'Password is required',
      },
    };
  },
  computed: {
    ...mapGetters(['theme']),
  },
  methods: {
    validate() {
      if (this.$refs.form.validate()) {
        const { email } = this;
        const { password } = this;
        this.$store
          .dispatch('signin', { email, password })
          .then(() => this.$router.push(this.config.sign.route))
          .catch((err) => console.log(err));
      }
    },
    reset() {
      this.$refs.form.reset();
    },
  },
};
</script>
