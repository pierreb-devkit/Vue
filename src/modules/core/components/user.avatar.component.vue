<!--
 Example:
 <userAvatarComponent :user="user" :size="32" />
-->
<template>
  <v-tooltip location="bottom">
    <template #activator="{ props: tooltipProps }">
      <v-avatar
        v-bind="tooltipProps"
        :size="size"
        :color="!hasAvatar ? avatarColor : undefined"
      >
        <v-img
          v-if="hasAvatar"
          :src="setImages(config.api, user.avatar, size * 2, null)"
          :alt="fullName"
        />
        <span v-else :class="textColorClass" :style="{ fontSize: `${Math.max(size * 0.4, 10)}px`, fontWeight: 500 }">
          {{ initials }}
        </span>
      </v-avatar>
    </template>
    <span>{{ fullName }}</span>
  </v-tooltip>
</template>

<script>
/**
 * @desc Reusable user avatar component.
 * Shows uploaded avatar image or falls back to colored initials.
 * Color is derived from email hash for consistency.
 */

/**
 * Determine whether a hex color is light (needs dark text for contrast).
 * Uses relative luminance per WCAG 2.x.
 * @param {string} hex - Hex color code.
 * @returns {boolean} True if the background is light.
 */
function isLightColor(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.5;
}

/**
 * Generate a consistent color from a string using a simple hash.
 * @param {string} str - Input string (email).
 * @returns {string} Hex color code.
 */
function stringToColor(str) {
  const palette = [
    '#1E88E5', '#43A047', '#E53935', '#8E24AA', '#FB8C00',
    '#00ACC1', '#3949AB', '#D81B60', '#7CB342', '#6D4C41',
    '#5E35B1', '#039BE5', '#C0CA33', '#F4511E', '#00897B',
    '#FFB300',
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
}

export default {
  name: 'UserAvatarComponent',
  props: {
    user: {
      type: Object,
      default: null,
    },
    size: {
      type: Number,
      default: 32,
    },
  },
  computed: {
    hasAvatar() {
      return !!(this.user && this.user.avatar && this.user.avatar !== '');
    },
    initials() {
      if (!this.user) return '';
      const f = (this.user.firstName || '').charAt(0).toUpperCase();
      const l = (this.user.lastName || '').charAt(0).toUpperCase();
      return f + l || '?';
    },
    fullName() {
      if (!this.user) return '';
      return [this.user.firstName, this.user.lastName].filter(Boolean).join(' ') || this.user.email || '';
    },
    avatarColor() {
      return stringToColor((this.user && this.user.email) || '');
    },
    textColorClass() {
      return isLightColor(this.avatarColor) ? 'text-black' : 'text-white';
    },
  },
};
</script>
