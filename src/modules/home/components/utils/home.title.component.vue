<template>
  <v-col v-if="setup.title || setup.subtitle" cols="12" :class="offpadding ? 'text-left pa-0' : 'text-left'">
    <h4
      v-if="setup.title"
      data-aos="fade"
      class="text-h4 text-md-h3 text-xs-h4 text-primary font-weight-bold my-4"
      :class="slide ? 'ml-16' : null"
      v-text="setup.title"
    ></h4>
    <h5 v-if="setup.subtitle" class="text-h5 text-md-h4 text-secondary font-weight-bold my-4" v-text="setup.subtitle"></h5>
  </v-col>
</template>
<script>
/**
 * Export default
 */
export default {
  name: 'HometitleComponent',
  props: {
    setup: {
      type: Object,
      required: true,
    },
    offpadding: {
      type: Boolean,
      default: false,
    },
    slide: {
      type: Boolean,
      default: false,
    },
  },
};
</script>
