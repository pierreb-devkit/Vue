<template>
  <div data-aos="fade">
    <homeTitleComponent v-if="item.subtitle" :setup="{ subtitle: item.subtitle }" :offpadding="true"></homeTitleComponent>
    <VMarkdown
      v-if="item.text"
      :style="item.quote ? { 'line-height': '1.8em' } : { 'line-height': '1.6em' }"
      :class="item.quote ? 'text-body-1 text-md-h6' : 'text-body-1'"
      class="text-left font-weight-regular"
      :source="item.text"
    />
    <v-btn
      v-if="item.button && item.button.title && item.button.link"
      :href="item.button.link"
      variant="text"
      class="my-4 text-none text-body-1"
      color="secondary"
      size="large"
    >
      {{ item.button.title }}
      <v-icon class="ml-4" size="x-small">fa-solid fa-arrow-right</v-icon>
    </v-btn>
  </div>
</template>

<script>
/**
 * Module dependencies.
 */
import homeTitleComponent from './home.title.component.vue';

/**
 * Export default
 */
export default {
  name: 'HomeContentTextComponent',
  components: {
    homeTitleComponent,
  },
  props: {
    item: {
      type: Object,
      default: () => {},
    },
  },
};
</script>
