<template>
  <div>
    <PageHeader
      :icon="icon"
      :title="title"
      :subtitle="subtitle"
      :title-class="titleClass"
      :avatar-color="avatarColor"
    >
      <template v-if="$slots.avatar" #avatar><slot name="avatar"></slot></template>
      <template v-if="$slots.title" #title><slot name="title"></slot></template>
      <template v-if="$slots.subtitle" #subtitle><slot name="subtitle"></slot></template>
      <template v-if="$slots.breadcrumb" #breadcrumb><slot name="breadcrumb"></slot></template>
      <template v-if="$slots.actions" #actions><slot name="actions"></slot></template>
    </PageHeader>
    <CoreSurfaceTabBar
      v-if="!hideTabs && tabs && tabs.length > 0"
      :tabs="tabs"
      :can="can"
      :base-path="basePath"
    />
  </div>
</template>

<script>
import PageHeader from './core.pageHeader.component.vue';
import CoreSurfaceTabBar from './core.surfaceTabBar.component.vue';

/**
 * CorePageHeaderTabs — bundles a fixed-height PageHeader (title↔breadcrumb
 * rhythm preserved across route transitions) with a CoreSurfaceTabBar
 * sibling. Use on surfaces where a tab bar is part of the page chrome
 * (Account, Organization detail, Admin). Pages without tabs (Tasks, list
 * views) should use `PageHeader` directly, which is content-sized.
 */
export default {
  name: 'CorePageHeaderTabs',
  components: { PageHeader, CoreSurfaceTabBar },
  props: {
    title: { type: String, default: '' },
    subtitle: { type: String, default: '' },
    icon: { type: String, default: '' },
    titleClass: { type: String, default: '' },
    avatarColor: { type: String, default: 'primary' },
    tabs: { type: Array, default: () => [] },
    can: { type: Function, required: true },
    basePath: { type: String, required: true },
    hideTabs: { type: Boolean, default: false },
  },
};
</script>

<style scoped>
/*
 * Canonical 56px height — enforced only on tabbed surfaces so list view
 * (title) and detail view (breadcrumb) stay aligned across route changes
 * without jumping. Pages without tabs let the header be content-sized.
 */
:deep(.core-page-header) {
  min-height: 56px;
  max-height: 56px;
}
</style>
