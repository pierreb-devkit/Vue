<!--
  HomeImgComponent
  ================
  Responsive image component with lazy loading, gradient overlay, and optional text.

  USAGE:
  <homeImgComponent
    :img="'/images/photo.webp'"
    :height="'350px'"
    :gradient="'to bottom, rgba(0,0,0,.1), rgba(0,0,0,.7)'"
    :title="'Image Title'"
    :text="'Description text'"
  />

  PROPS:
  - img (String, required): Image source URL
  - height (String): Custom height (default: responsive 225-350px)
  - gradient (String): CSS gradient overlay
  - title (String): Title text displayed on image
  - text (String): Description text displayed on image

  NOTES:
  - Uses lazy-src for placeholder during loading
  - Displays loading spinner while image loads
  - Applies theme rounded corners automatically
-->
<template>
  <v-img
    :src="img"
    lazy-src="/images/lazy.webp"
    :class="`${config.vuetify.theme.rounded}`"
    :height="height || ($vuetify.display.xsAndDown ? '225px' : $vuetify.display.smAndDown ? '300px' : '350px')"
    :gradient="gradient"
    cover
    :alt="title || 'image'"
  >
    <template #placeholder>
      <div class="d-flex align-center justify-center fill-height">
        <v-progress-circular color="grey-lighten-4" indeterminate></v-progress-circular>
      </div>
    </template>
    <v-card-title v-if="title" class="px-10 text-white text-h6 font-weight-bold"> {{ title }}</v-card-title>
    <v-card-text v-if="text" class="px-10 text-white text-body-1 pb-5"> {{ text }}</v-card-text>
  </v-img>
</template>
<script>
/**
 * Component definition.
 */
export default {
  name: 'HomeImgComponent',
  props: {
    img: {
      type: String,
      required: true,
    },
    gradient: {
      type: String,
      default: '',
    },
    title: {
      type: String,
      default: '',
    },
    text: {
      type: String,
      default: '',
    },
    height: {
      type: String,
      default: '',
    },
  },
};
</script>
