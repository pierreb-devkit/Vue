<!-- eslint-disable-next-line vue/valid-template-root -->
<template><span style="display:none" /></template>

<script setup>
import { computed, watch, onUnmounted, getCurrentInstance } from 'vue';
import { useI18n } from 'vue-i18n';
import { useCookieConsent } from '../composables/useCookieConsent';
import { useFooterExtras } from '@/lib/composables/useFooterExtras';

const SECTION_ID = 'legal';
const { t } = useI18n();
const instance = getCurrentInstance();
const config = computed(() => instance?.proxy?.config || instance?.appContext?.config?.globalProperties?.config || {});
const { reopenSettings } = useCookieConsent();
const { register, unregister } = useFooterExtras();

/**
 * Derives the legal footer section from config.
 * Returns null when neither cookieConsent nor pages are enabled.
 * @type {import('vue').ComputedRef<{title: string, items: Array}|null>}
 */
const section = computed(() => {
  const cc = config.value?.legal?.cookieConsent;
  const pages = config.value?.legal?.pages;
  const items = [];

  if (pages?.enabled && pages.items) {
    Object.values(pages.items)
      .filter((it) => it.enabled)
      .forEach((it) => {
        items.push({
          label: it.title,
          icon: 'fa-solid fa-file-lines',
          url: `${pages.routePrefix || '/legal'}/${it.slug}`,
        });
      });
  }

  if (cc?.enabled) {
    items.push({
      label: t('legal.footer.cookieSettings'),
      icon: 'fa-solid fa-cookie-bite',
      onClick: reopenSettings,
    });
  }

  if (items.length === 0) return null;
  return { title: t('legal.footer.sectionTitle'), items };
});

watch(
  section,
  (val) => {
    if (val) register(SECTION_ID, val);
    else unregister(SECTION_ID);
  },
  { immediate: true },
);

onUnmounted(() => unregister(SECTION_ID));
</script>
