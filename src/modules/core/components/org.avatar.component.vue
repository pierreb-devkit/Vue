<!--
 Example:
 <orgAvatarComponent :org="currentOrganization" :size="24" />
-->
<template>
  <v-avatar
    :color="color"
    :size="size"
  >
    <v-tooltip activator="parent" location="bottom">
      {{ tooltipText }}
    </v-tooltip>
    <span
      class="font-weight-bold"
      :class="fontClass"
      style="color: white;"
    >
      {{ initial }}
    </span>
  </v-avatar>
</template>

<script>
/**
 * Module dependencies.
 */
import orgColor from '../../../lib/helpers/orgColor';

/**
 * Component definition.
 */
export default {
  name: 'OrgAvatarComponent',
  props: {
    org: {
      type: Object,
      required: true,
    },
    size: {
      type: Number,
      default: 32,
    },
  },
  computed: {
    /**
     * @desc First letter of the organization name, uppercased.
     * @returns {string}
     */
    initial() {
      return (this.org?.name || '?').charAt(0).toUpperCase();
    },
    /**
     * @desc Deterministic color derived from org name.
     * @returns {string}
     */
    color() {
      return orgColor(this.org);
    },
    /**
     * @desc Full organization name for the tooltip.
     * @returns {string}
     */
    tooltipText() {
      return this.org?.name || '';
    },
    /**
     * @desc Typography class scaled to avatar size.
     * @returns {string}
     */
    fontClass() {
      if (this.size >= 36) return 'text-body-large';
      if (this.size >= 28) return 'text-body-medium';
      return 'text-label-small';
    },
  },
};
</script>
