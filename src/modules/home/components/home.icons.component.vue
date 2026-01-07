<template>
  <section id="reviews" :style="style('section', setup)">
    <v-container :style="`max-width: ${config.vuetify.theme.maxWidth}`">
      <v-row v-if="setup.content.length > 0" align="center" justify="center" class="px-0 py-8">
        <homeTitleComponent :setup="setup"></homeTitleComponent>
        <v-col v-for="(item, i) in setup.content" :key="i" cols="12" sm="12" md="4" data-aos="fade">
          <v-card :class="`text-center pt-8 pb-2 ${config.vuetify.theme.rounded}`" :flat="config.vuetify.theme.flat" :style="style('card', setup)">
            <v-btn icon :color="item.color ? item.color : 'primary'" width="100" height="100" class="text-white">
              <v-icon :icon="item.icon" size="x-large"></v-icon>
            </v-btn>
            <homeCardsTextComponent :item="item"></homeCardsTextComponent>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </section>
</template>

<script>
/**
 * Module dependencies.
 */
import { style } from '../../../lib/helpers/theme';
import homeTitleComponent from './utils/home.title.component.vue';
import homeCardsTextComponent from './utils/home.card.text.component.vue';
/**
 * Component definition.
 */
export default {
  name: 'HomeReviewsComponent',
  components: {
    homeTitleComponent,
    homeCardsTextComponent,
  },
  props: {
    setup: {
      type: Object,
      required: true,
    },
  },
  methods: {
    style,
  },
};
</script>
