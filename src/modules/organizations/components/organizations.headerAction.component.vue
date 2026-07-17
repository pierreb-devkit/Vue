<!-- eslint-disable-next-line vue/valid-template-root -->
<template><span style="display:none" /></template>

<script setup>
/**
 * @desc Invisible registrar — contributes the organizations switcher to the
 * account page header via `useUserHeaderActions` (mirrors
 * `legal.footerSection.component.vue`'s `useFooterExtras` registration
 * pattern) instead of `user.view.vue` importing organizations directly.
 * Mounted once from the app shell (`app.vue`, the composition root — same
 * place `organizationsAdminPendingBanner`/`organizationsLoginNotices` are
 * already mounted), so registration and the on-login pre-load below are
 * independent of which page is active — a superset of the previous
 * `user.view.vue`-scoped watcher (which only pre-loaded while an account
 * page was mounted), closing the deep-link race it guarded against even
 * earlier.
 *
 * The switcher self-gates its own visibility (`organizationsEnabled &&
 * organizations.length > 0`), so it is always registered here — mirroring
 * how it was previously always imported and rendered unconditionally by
 * `user.view.vue`.
 */
import { onUnmounted, watch } from 'vue';
import { useAuthStore } from '../../auth/stores/auth.store';
import { useOrganizationsStore } from '../stores/organizations.store';
import { useUserHeaderActions } from '../../../lib/composables/useUserHeaderActions';
import organizationsSwitcherComponent from './organizations.switcher.component.vue';

const ENTRY_ID = 'organizations-switcher';
const authStore = useAuthStore();
const organizationsStore = useOrganizationsStore();
const { register, unregister } = useUserHeaderActions();

register(ENTRY_ID, organizationsSwitcherComponent);
onUnmounted(() => unregister(ENTRY_ID));

/**
 * @desc Pre-load organizations as soon as auth flips to logged-in — routes
 * the behavior previously owned by `user.view.vue`'s `isLoggedIn` watcher
 * through this seam. Errors are logged rather than swallowed (the previous
 * `.catch(() => {})` silently dropped fetch failures).
 */
watch(
  () => authStore.isLoggedIn,
  async (loggedIn) => {
    if (!loggedIn) return;
    try {
      await organizationsStore.fetchOrganizations();
    } catch (err) {
      console.error(err);
    }
  },
  { immediate: true },
);
</script>
