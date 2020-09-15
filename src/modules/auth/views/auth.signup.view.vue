<template>
  <v-container fluid>
    <v-row align="start" justify="center">
      <v-card
        class="mx-6 my-3 pa-5"
        outlined
        tile
        width="100%"
        :style="{ background: config.vuetify.theme.themes[theme].surface }"
        :flat="config.vuetify.theme.flat"
      >
        <v-col cols="12">
          <v-subheader><h4>Sign Up</h4></v-subheader>
          <v-divider></v-divider>
        </v-col>
        <v-container>
          <v-form ref="form" v-model="valid">
            <v-row>
              <v-col cols="12" md="6" sm="6" class="py-0 my-0">
                <v-text-field
                  v-model="firstName"
                  :rules="[rules.firstName]"
                  label="Firstname"
                  prepend-icon="fa fa-user"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6" sm="6" class="py-0 my-0">
                <v-text-field
                  v-model="lastName"
                  :rules="[rules.lastName]"
                  label="Lastname"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="12" sm="12">
                <v-text-field
                  v-model="email"
                  :rules="[rules.required, rules.mail]"
                  label="E-mail"
                  prepend-icon="fa fa-envelope"
                  required
                ></v-text-field>
                <v-text-field
                  :type="'password'"
                  v-model="password"
                  :rules="[rules.password]"
                  label="Password"
                  prepend-icon="fa fa-key"
                  required
                ></v-text-field>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="6">
                <v-btn :disabled="!valid" color="success" class="mr-4" @click="validate"
                  >Validate</v-btn
                >
                <v-btn
                  v-if="config.oAuth.google"
                  :href="`${oAuth}/google`"
                  class="white--text mr-4 blue"
                  ><v-icon>fab fa-google</v-icon>
                </v-btn>
                <v-btn
                  v-if="config.oAuth.apple"
                  :href="`${oAuth}/apple`"
                  class="white--text mr-4 grey darken-2"
                  ><v-icon>fab fa-apple</v-icon>
                </v-btn>
              </v-col>
              <v-col cols="6" class="text-right">
                <v-btn color="error" class="mr-4" @click="reset">Reset Form</v-btn>
              </v-col>
            </v-row>
          </v-form>
          <br />
          <p><router-link to="/signin">Sign In</router-link> if you already have an account :) !</p>
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
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      oAuth: `${this.config.api.protocol}://${this.config.api.host}:${this.config.api.port}/${this.config.api.base}/${this.config.api.endPoints.auth}`,
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
    ...mapGetters(['theme']),
  },
  methods: {
    validate() {
      if (this.$refs.form.validate()) {
        const { firstName } = this;
        const { lastName } = this;
        const { email } = this;
        const { password } = this;
        this.$store
          .dispatch('signup', {
            email,
            password,
            firstName,
            lastName,
          })
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
