<!-- eslint-disable-next-line vue/valid-template-root -->
<template><span style="display:none" /></template>

<script setup>
/**
 * @desc Invisible registrar — contributes the compute-usage gauge to the
 * core navigation drawer via `useNavExtras` (mirrors `legal.footerSection.component.vue`'s
 * `useFooterExtras` registration pattern) instead of `core.navigation.component.vue`
 * importing billing directly. Mounted once from the app shell (`app.vue`,
 * the composition root — same place `legalFooterSection` is mounted), so
 * registration is independent of which page is active.
 *
 * Gate: registered only while `meterMode` is active — reactively toggled so
 * the gauge appears/disappears exactly as the previous inline
 * `v-if="meterMode"` in core.navigation.component.vue did.
 */
import { computed, watch, onUnmounted } from 'vue';
import { useAuthStore } from '../../auth/stores/auth.store';
import { useNavExtras } from '../../../lib/composables/useNavExtras';
import BillingNavComputeGaugeComponent from './billing.navComputeGauge.component.vue';

const ENTRY_ID = 'billing-nav-compute-gauge';
const authStore = useAuthStore();
const { register, unregister } = useNavExtras();

/**
 * @desc Whether the app is in meter mode (compute billing active). Mirrors
 * the gate previously inline in core.navigation.component.vue.
 * @returns {import('vue').ComputedRef<boolean>}
 */
const meterMode = computed(() => authStore.serverConfig?.billing?.meterMode === true);

watch(
  meterMode,
  (active) => {
    if (active) register(ENTRY_ID, BillingNavComputeGaugeComponent);
    else unregister(ENTRY_ID);
  },
  { immediate: true },
);

onUnmounted(() => unregister(ENTRY_ID));
</script>
