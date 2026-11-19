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
          :src="setImages(config.api, user.avatar, avatarSize, null)"
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
import { hashColor, avatarTextClass } from '../../../lib/helpers/orgColor';

/**
 * @desc Reusable user avatar component.
 * Shows uploaded avatar image or falls back to colored initials.
 * Color is derived from email hash for consistency.
 */

/**
 * Allowed avatar sizes served by the backend `/api/uploads/images/` endpoint.
 * Mirrors the sharp-resize whitelist in devkit Node
 * `modules/uploads/config/uploads.{env}.config.js` (field `uploads.avatar.sharp.sizes`).
 * Any value outside this list returns HTTP 422 "Wrong size param" — if you
 * change one, update the other.
 */
const SHARP_SIZES = [128, 256, 512, 1024];

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
    /**
     * Snap the requested avatar size (doubled for retina) to the backend
     * sharp whitelist. Any value outside `SHARP_SIZES` would return HTTP 422,
     * so we pick the smallest allowed size that fits — or cap at the largest.
     * @returns {number} A size from `SHARP_SIZES` (128, 256, 512, or 1024).
     */
    avatarSize() {
      const requested = this.size * 2;
      return SHARP_SIZES.find((s) => s >= requested) ?? SHARP_SIZES[SHARP_SIZES.length - 1];
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
      return hashColor((this.user && this.user.email) || '');
    },
    textColorClass() {
      return avatarTextClass(this.avatarColor);
    },
  },
};
</script>
