<template>
  <section id="stats" class="black" v-if="statistics.length > 0">
    <v-parallax
      :height="$vuetify.breakpoint.smAndDown ? 700 : 500"
      :src="
        config.home.stats.background ||
        require('@/assets/images/backgroundParalax.jpg')
      "
    >
      <v-container fill-height>
        <v-row class="mx-auto">
          <v-col
            v-for="({ value, title }, i) in statistics"
            :key="i"
            cols="12"
            md="3"
          >
            <div class="text-center">
              <div
                class="display-3 font-weight-black mb-4"
                v-text="value"
                data-aos="fade"
              ></div>
              <div
                class="title font-weight-regular text-uppercase"
                v-text="title"
              ></div>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </v-parallax>
  </section>
</template>

<script>
/**
 * Export default
 */
export default {
  name: 'homeStatsComponent',
  props: ['statistics'],
};
</script>
