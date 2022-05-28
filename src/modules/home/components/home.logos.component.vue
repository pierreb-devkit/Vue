<!--
  - Call example
  <homeLogosComponent
    v-bind:logos="sponsors"
    v-bind:size="150"
    v-bind:ratio="1"
    v-bind:custom="null"
  ></homeLogosComponent>
  - Data Example
  sponsors: {
    title: 'Sponsor',
    data: [
      [{
        title: 'OpenCollective',
        image: 'logos/opencollective.png',
        link: 'https://opencollective.com/weareopensource',
      }, {
        title: 'Ko-fi',
        image: 'logos/patreon.png',
        link: 'https://ko-fi.com/weareopensource',
      }, {
        title: 'Patreon',
        image: 'logos/kofi.png',
        link: 'https://patreon.com/weareopensource',
      }],
    ],
  },
-->
<template>
  <section id="features" class="py-12" :style="custom && custom.section ? custom.section : null" v-if="logos.data.length > 0">
    <v-container class="text-center">
      <h2
        class="font-weight-bold mb-3 pb-8 text-h4 text-center"
        style="text-transform: uppercase !important"
        v-if="logos.title"
        v-text="logos.title"
      ></h2>
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
                <!-- eslint-disable-next-line -->
                <a :href="link">
                  <v-avatar v-on="on" v-if="link" :size="size">
                    <v-img v-if="image" :src="image" alt="logo" />
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
