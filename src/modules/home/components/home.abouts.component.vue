<!--
  - Call example
    <homeAboutsComponent
      v-bind:abouts="abouts"
      v-bind:custom="null"
      v-bind:md="6"
    ></homeAboutsComponent>
  - Data Example
    abouts: [
      {
        title: 'Concept',
        text: '[WAOS](https://blog.weareopensource.me/us/) aims at simpli ... ',
        image: null,
        button: null,
        link: null,
      },
    ],
-->
<template>
  <section id="about-me" v-if="abouts.length > 0" :style="custom && custom.section ? custom.section : null">
    <v-container class="text-center pb-12">
      <v-row align="center" justify="center">
        <v-col v-for="({ title, text, image, button, link }, i) in abouts" :key="i" cols="12" :md="md">
          <h2 class="font-weight-bold mb-3 py-8 text-h4 text-center" style="text-transform: uppercase !important" v-text="title"></h2>
          <v-responsive class="mx-auto title font-weight-light mb-8" max-width="720">
            <v-markdown :source="text" />
          </v-responsive>
          <v-avatar v-if="image" class="elevation-12 mb-12" size="128">
            <v-img :src="image"></v-img>
          </v-avatar>
          <br v-if="link" />
          <v-btn v-if="link" color="grey" :href="link" large>
            <span v-text="button"></span>
          </v-btn>
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
  props: ['abouts', 'custom', 'md'],
};
</script>
