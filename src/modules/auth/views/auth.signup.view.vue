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
              <v-col md="6" sm="12">
                <v-text-field
                  v-model="firstName"
                  :rules="[rules.firstName]"
                  label="Firstname"
                  required
                ></v-text-field>
              </v-col>
              <v-col md="6" sm="12">
                <v-text-field
                  v-model="lastName"
                  :rules="[rules.lastName]"
                  label="Lastname"
                  required
                ></v-text-field>
              </v-col>
              <v-col md="12" sm="12">
                <v-text-field
                  v-model="email"
                  :rules="[rules.required, rules.mail]"
                  label="E-mail"
                  required
                ></v-text-field>
              </v-col>
              <v-col md="12" sm="12">
                <v-text-field
                  :type="'password'"
                  v-model="password"
                  :rules="[rules.password]"
                  label="Password"
                  required
                ></v-text-field>
              </v-col>
            </v-row>
            <v-row>
              <v-btn
                :disabled="!valid"
                color="success"
                class="mr-4"
                @click="validate"
                >Validate</v-btn
              >
              <v-btn color="error" class="mr-4" @click="reset"
                >Reset Form</v-btn
              >
            </v-row>
          </v-form>
          <br />
          <router-link to="/signin">Sign In</router-link> if you already have an
          account :) !
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
