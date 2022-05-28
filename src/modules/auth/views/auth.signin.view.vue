<template>
  <v-container fluid>
    <v-row align="start" justify="center">
      <v-card
        class="ma-6 pa-6"
        width="100%"
        :style="{ background: config.vuetify.theme.themes[theme].colors.surface }"
        :flat="config.vuetify.theme.flat"
      >
        <v-col cols="12">
          <h4>Sign In</h4>
          <v-divider></v-divider>
        </v-col>
        <v-container>
          <v-form ref="form" v-model="valid">
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
                  :type="'password'"
                  :rules="[rules.password]"
                  v-model="password"
                  label="Password"
                  prepend-icon="fa fa-key"
                  required
                ></v-text-field>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="6">
                <!-- TODO fix diabled <v-btn :disabled="!valid" color="success" class="mr-4" @click="validate">Validate</v-btn> -->
                <v-btn :flat="config.vuetify.theme.flat" color="success" class="mr-4" @click="validate">Validate</v-btn>
                <v-btn variant="outlined" color="secondary" v-if="config.oAuth.google" :href="`${oAuth}/google`" class="text-white mr-4 blue"
                  ><v-icon icon="fab fa-google"></v-icon>
                </v-btn>
                <v-btn variant="outlined" color="secondary" v-if="config.oAuth.apple" :href="`${oAuth}/apple`" class="text-white mr-4 grey darken-2"
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
import { mapGetters } from 'vuex';
/**
 * Export default
 */
export default {
  data() {
    return {
      valid: true, // TODO: switch to false when forms will be reactive
      email: '',
      password: '',
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
    ...mapGetters(['auth', 'theme']),
  },
  watch: {
    auth(auth) {
      if (auth) this.$router.push(this.config.sign.route);
    },
  },
  methods: {
    async validate() {
      const form = await this.$refs.form.validate();
      if (form.valid) {
        this.$store
          .dispatch('signin', {
            email: this.email,
            password: this.password,
          })
          .catch((err) => console.log(err));
      }
    },
    reset() {
      this.$refs.form.reset();
    },
  },
};
</script>
