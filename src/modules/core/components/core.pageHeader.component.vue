<template>
  <v-row class="mx-4 my-1" align="center" :style="$slots.tabs ? { minHeight: '56px' } : null">
    <template v-if="$slots.tabs">
      <!-- Tabs mode: tabs replace icon + title -->
      <slot name="tabs"></slot>
    </template>
    <template v-else>
      <!-- Standard mode: icon + title -->
      <slot v-if="!$vuetify.display.mobile" name="avatar">
        <v-avatar v-if="icon" :color="avatarColor" size="40">
          <v-icon :icon="icon" size="small" color="white"></v-icon>
        </v-avatar>
      </slot>
      <div class="ml-3">
        <h2 class="text-title-large font-weight-medium" :class="titleClass" style="line-height: 1;">
          <slot name="title">{{ title }}</slot>
        </h2>
        <p v-if="subtitle || $slots.subtitle" class="text-body-medium text-medium-emphasis" style="margin: 0; line-height: 1;">
          <slot name="subtitle">{{ subtitle }}</slot>
        </p>
      </div>
    </template>
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
