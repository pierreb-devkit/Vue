<template>
  <v-row class="core-page-header mx-4 my-1 flex-nowrap" align="center">
    <template v-if="$slots.tabs">
      <!-- Tabs mode: tabs replace icon + title -->
      <slot name="tabs"></slot>
    </template>
    <template v-else>
      <!-- Standard mode: icon + (breadcrumb OR title) -->
      <slot v-if="!$vuetify.display.mobile" name="avatar">
        <v-avatar v-if="icon" :color="avatarColor" size="40">
          <v-icon :icon="icon" size="small" color="white"></v-icon>
        </v-avatar>
      </slot>
      <div
        class="core-page-header__content"
        :class="[
          $vuetify.display.mobile ? 'ml-6' : '',
          !$vuetify.display.mobile && ($slots.avatar || icon) ? 'ml-2' : '',
        ]"
      >
        <!-- Breadcrumb takes precedence over title when provided -->
        <div
          v-if="$slots.breadcrumb"
          class="core-page-header__breadcrumb text-title-large font-weight-medium text-truncate"
          :class="titleClass"
          style="line-height: 1;"
        >
          <slot name="breadcrumb"></slot>
        </div>
        <template v-else>
          <h2
            class="core-page-header__title text-title-large font-weight-medium text-truncate"
            :class="titleClass"
            style="line-height: 1;"
          >
            <slot name="title">{{ title }}</slot>
          </h2>
          <p
            v-if="subtitle || $slots.subtitle"
            class="core-page-header__subtitle text-body-medium text-medium-emphasis text-truncate"
            style="margin: 0; line-height: 1;"
          >
            <slot name="subtitle">{{ subtitle }}</slot>
          </p>
        </template>
      </div>
    </template>
    <v-spacer></v-spacer>
    <!-- Actions slot — wrapped in a flex cluster (flex-wrap = safety net for extreme viewports) -->
    <div v-if="$slots.actions" class="core-page-header__actions d-flex align-center flex-wrap">
      <slot name="actions"></slot>
    </div>
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

<style scoped>
/*
 * Canonical 56px height — keeps list view (title) and detail view (breadcrumb)
 * visually aligned so route transitions don't jump.
 */
.core-page-header {
  min-height: 56px;
  max-height: 56px;
}

/*
 * flex: 1 + min-width: 0 lets the title/breadcrumb container shrink past its
 * intrinsic width when content is long, so the truncate kicks in instead of
 * pushing the actions cluster off-screen.
 */
.core-page-header__content {
  flex: 1 1 0;
  min-width: 0;
}
</style>
