<template>
  <v-container fluid>
    <v-row align="start" justify="center">
      <v-card class="ma-6 pa-6" width="100%" :style="{ background: config.vuetify.theme.themes[theme].surface }" :flat="config.vuetify.theme.flat">
        <v-col cols="12">
          <v-subheader><h4>Error during oAuth</h4></v-subheader>
          <v-divider></v-divider>
        </v-col>
        <v-container>
          <v-alert type="error" color="error">
            <b>{{ $route.query.message }}</b> : {{ error.details.message }}
            <span v-for="(key, i) in Object.keys(error.details.errors)" :key="i">{{ error.details.errors[key].message }}</span>
          </v-alert>
          <br />
          <p>
            Back to
            <b>
              <router-link to="/signin">Sign In</router-link>
            </b>
            or
            <b>
              <router-link to="/signup">Sign Up</router-link>
            </b>
            !
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
      error: '',
    };
  },
  computed: {
    ...mapGetters(['theme']),
  },
  created() {
    if (!this.$route.query.message) {
      this.$store
        .dispatch('token')
        .then(() => this.$router.push(this.config.sign.route))
        .catch((err) => console.log(err));
    } else {
      this.error = JSON.parse(this.$route.query.error);
      console.log(this.error);
    }
  },
};
</script>
