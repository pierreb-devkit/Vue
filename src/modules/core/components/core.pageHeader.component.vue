<template>
  <v-row class="mx-4 mt-4 mb-2" align="center">
    <!-- Icon in avatar circle -->
    <slot name="avatar">
      <v-avatar v-if="icon" :color="avatarColor" size="40" class="mr-3">
        <v-icon :icon="icon" size="small" color="white"></v-icon>
      </v-avatar>
    </slot>
    <!-- Title / Subtitle -->
    <div>
      <h2 class="text-title-large font-weight-medium" :class="titleClass" style="line-height: 1;">
        <slot name="title">{{ title }}</slot>
      </h2>
      <p v-if="subtitle || $slots.subtitle" class="text-body-medium text-medium-emphasis" style="margin: 0; line-height: 1;">
        <slot name="subtitle">{{ subtitle }}</slot>
      </p>
    </div>
    <v-spacer></v-spacer>
    <!-- Actions slot -->
    <slot name="actions"></slot>
  </v-row>
</template>

<script>
export default {
  name: 'CorePageHeader',
  props: {
    title: {
      type: String,
      default: '',
    },
    subtitle: {
      type: String,
      default: '',
    },
    icon: {
      type: String,
      default: '',
    },
    titleClass: {
      type: String,
      default: '',
    },
    avatarColor: {
      type: String,
      default: 'primary',
    },
  },
};
</script>
