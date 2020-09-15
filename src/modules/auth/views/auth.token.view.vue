<template>
  <v-container fluid> </v-container>
</template>

<script>
/**
 * Export default
 */
export default {
  created() {
    this.$store
      .dispatch('token')
      .then(() => this.$router.push(this.config.sign.route))
      .catch((err) => console.log(err));
  },
};
</script>
