<!--
  - Call example
    <homeFeaturesComponent
      v-bind:features="features"
      v-bind:custom="null"
    ></homeFeaturesComponent>
  - Data Example
    features: {
      title: 'Stacks',
      data: [
        {
          icon: 'fa-brand fa-vuejs',
          title: 'Vue',
          text: '**Alpha Front Stack** <br> Classic auth with landing page ...',
          color: '#186b9f',
        },
      ],
    },
-->
<template>
  <section id="features" class="py-12" :style="custom && custom.section ? custom.section : null" v-if="features.data.length > 0">
    <v-container class="text-center">
      <h2
        class="font-weight-bold mb-3 pb-8 text-h4 text-center"
        style="text-transform: uppercase !important"
        v-if="features.title"
        v-text="features.title"
      ></h2>
      <v-row justify="center">
        <v-col v-for="({ icon, title, text, color }, i) in features.data" :key="i" cols="12" md="4" data-aos="fade-up">
          <v-card class="pt-8 pb-2 px-4 rounded-xl" :flat="config.vuetify.theme.flat" :style="custom && custom.card ? custom.card : null">
            <div>
              <v-btn icon :color="color ? color : 'primary'" width="88" height="88" class="text-white">
                <v-icon :icon="icon" large></v-icon>
              </v-btn>
            </div>
            <v-card-title class="justify-center font-weight-black text-uppercase" v-text="title"></v-card-title>
            <v-card-text class="subtitle-1 text-medium-emphasis text-onSurface">
              <v-markdown :source="text" />
            </v-card-text>
          </v-card>
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
  name: 'homeAboutsComponent',
  props: ['features', 'custom'],
};
</script>
