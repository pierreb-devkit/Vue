<template>
  <v-container fluid>
    <v-row align="start" justify="center">
      <v-card
        class="ma-6 pa-6"
        width="100%"
        :style="{ background: config.vuetify.theme.themes[theme].surface }"
        :flat="config.vuetify.theme.flat"
      >
        <v-col cols="12">
          <v-subheader><h4>Reset</h4></v-subheader>
          <v-divider></v-divider>
        </v-col>
        <v-container>
          <v-form ref="form" v-model="valid">
            <v-row>
              <v-col cols="12">
                <v-text-field
                  :type="'password'"
                  :rules="[rules.password]"
                  v-model="password"
                  label="New password"
                  prepend-icon="fa fa-key"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-btn :disabled="!valid" color="success" class="mr-4" @click="validate"
                  >Validate</v-btn
                >
                <v-btn color="error" class="mr-4" @click="reset">Reset Form</v-btn>
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
import { mapGetters } from 'vuex';
/**
 * Export default
 */
export default {
  data() {
    return {
      valid: false,
      password: '',
      rules: {
        required: (v) => !!v || 'Required',
        mail: (v) => /\S+@\S+\.\S+/.test(v) || 'E-mail must be valid',
      },
    };
  },
  computed: {
    ...mapGetters(['theme', 'mail']),
  },
  methods: {
    validate() {
      if (this.$refs.form.validate()) {
        const { password } = this;
        this.$store
          .dispatch('reset', { newPassword: password, token: this.$route.query.token })
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
