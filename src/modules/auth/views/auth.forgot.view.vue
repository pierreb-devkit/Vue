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
          <v-subheader><h4>Forgot</h4></v-subheader>
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
              </v-col>
              <v-col cols="12">
                <v-btn
                  :disabled="!valid || mail.status"
                  color="success"
                  class="mr-4"
                  @click="validate"
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
          <v-alert v-if="mail.message" type="success">
            {{ mail.message }}
          </v-alert>
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
        const { email } = this;
        this.$store.dispatch('forgot', { email }).catch((err) => console.log(err));
      }
    },
    reset() {
      this.$refs.form.reset();
    },
  },
};
</script>
