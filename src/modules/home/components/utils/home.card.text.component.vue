<template>
  <div>
    <v-card-title class="text-center">
      <h4 v-if="item.subtitle" class="text-h6 text-md-h5 font-weight-bold my-3" v-text="item.subtitle"></h4>
    </v-card-title>
    <v-card-text class="px-6">
      <VMarkdown v-if="item.text" class="text-body-1 font-weight-regular text-left" :source="item.text" />
    </v-card-text>
    <v-card-actions v-if="item.button" align="center" justify="center">
      <v-spacer>
        <v-btn
          v-if="item.button.title"
          :href="item.button.link"
          class="mb-5 text-none font-weight-bold rounded-lg"
          size="large"
          :style="{ 'border-color': item.button.color, color: item.button.color, 'border-width': '1.5px' }"
          variant="outlined"
          >{{ item.button.title }}</v-btn
        ></v-spacer
      >
    </v-card-actions>
  </div>
</template>

<script>
/**
 * Component definition.
 */
export default {
  name: 'HomeCardTextComponent',
  props: {
    item: {
      type: Object,
      default: () => {},
    },
  },
};
</script>
