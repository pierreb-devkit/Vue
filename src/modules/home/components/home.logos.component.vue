<template>
  <section
    id="features"
    class="py-12"
    :style="custom && custom.section ? custom.section : null"
    v-if="logos.data.length > 0"
  >
    <v-container class="text-center">
      <h2 class="display-1 font-weight-bold mb-3 pb-8 text-uppercase" v-if="logos.title">
        {{ logos.title }}
      </h2>
      <v-row v-for="(data, i) in logos.data" :key="i" justify="center">
        <v-col
          v-for="({ image, link, title }, i) in data"
          :key="i"
          :cols="12 / ratio"
          :sm="6 / ratio"
          :md="4 / ratio"
          :lg="4 / ratio"
          :xl="2 / ratio"
        >
          <v-tooltip top>
            <template v-slot:activator="{ on }"
              ><div>
                <a :href="link">
                  <v-avatar v-on="on" v-if="link" :size="size">
                    <img v-if="image" :src="image" />
                  </v-avatar>
                </a>
              </div>
            </template>
            <span>{{ title }} </span>
          </v-tooltip>
        </v-col>
      </v-row>
    </v-container>
  </section>
</template>

<script>
/**
 * Export default
 */
export default {
  name: 'homeLogosComponent',
  props: ['logos', 'custom', 'size', 'ratio'],
};
</script>
