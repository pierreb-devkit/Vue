<!--
  HomeFeaturesComponent
  =====================
  Interactive feature switcher with horizontal navigation tabs.

  USAGE:
  <homeFeaturesComponent :setup="config.home.features" />

  CONFIG EXAMPLE (setup object):
  features: {
    title: 'Platform Features',
    subtitle: 'Everything you need to build modern applications',
    defaultActiveId: 'performance',
    style: {
      section: { background: 'background' },
      navCard: { background: 'surface' },
      contentCard: { background: 'surface' },
    },
    items: [
      {
        id: 'performance',
        label: 'Performance',
        icon: 'fa-solid fa-gauge-high',
        title: 'Lightning Fast',
        description: 'Built with performance in mind from the ground up...',
        cta: { text: 'Learn More', link: '/docs/performance' },
        image: '/images/feature-performance.png',
        reversed: false,
      },
      // ... more items
    ],
  }
-->
<template>
  <section id="capabilities" :style="sectionStyle">
    <v-container :style="containerStyle">
      <v-row align="center" justify="center" class="px-0 py-8">
        <!-- Title Section -->
        <v-col cols="12">
          <homeContentComponent :setup="setup"></homeContentComponent>
        </v-col>

        <!-- Navigation Tabs with Sliding Indicator -->
        <home-tabs v-model="activeIndex" :items="setup.items" @update:model-value="onTabChange" />

        <!-- Feature Content -->
        <v-window v-model="activeIndex" class="mt-4">
          <v-window-item
            v-for="(item, index) in setup.items"
            :key="item.id"
            :value="index"
            eager
            transition="fade-transition"
            reverse-transition="fade-transition"
          >
            <v-card :class="`${config.vuetify.theme.rounded}`" :flat="config.vuetify.theme.flat" :style="cardStyle">
              <v-row :class="item.reversed ? 'flex-row-reverse' : ''" align="center">
                <!-- Text Content -->
                <v-col cols="12" md="6" class="pa-8">
                  <homeContentComponent
                    :key="`text-${index}`"
                    :setup="{ subtitle: item.title, text: item.description, button: item.cta }"
                    variant="card"
                    alignment="left"
                  />
                </v-col>

                <!-- Image -->
                <v-col cols="12" md="6" class="pa-8">
                  <v-img
                    v-if="item.image"
                    :src="item.image"
                    :alt="item.title"
                    :class="`${config.vuetify.theme.rounded}`"
                    cover
                    eager
                    aspect-ratio="16/9"
                    :min-height="300"
                  ></v-img>
                </v-col>
              </v-row>
            </v-card>
          </v-window-item>
        </v-window>
      </v-row>
    </v-container>
  </section>
</template>

<script>
/**
 * Module dependencies.
 */
import { useTheme } from 'vuetify';
import { style, overlapStyle } from '../../../lib/helpers/theme';
import homeContentComponent from './utils/home.content.component.vue';
import HomeTabs from './utils/home.tabs.component.vue';

/**
 * Component definition.
 */
export default {
  name: 'HomeCapabilitiesComponent',
  components: {
    homeContentComponent,
    HomeTabs,
  },
  props: {
    setup: {
      type: Object,
      required: true,
    },
  },
  data() {
    const theme = useTheme();
    return {
      activeIndex: 0,
      theme,
    };
  },
  computed: {
    variant() {
      return this.setup.variant || 'default';
    },
    containerStyle() {
      return {
        'max-width': this.config.vuetify.theme.maxWidth,
        ...overlapStyle(this.setup.overlap, this.$vuetify?.display),
      };
    },
    sectionStyle() {
      const bgColor = this.variant === 'alternate' ? this.theme.current.colors.surface : this.theme.current.colors.background;
      return {
        ...style('section', this.setup),
        background: bgColor,
      };
    },
    cardStyle() {
      // Inverse la couleur de la card par rapport à la section
      const cardColor = this.variant === 'alternate' ? this.theme.current.colors.background : this.theme.current.colors.surface;
      return {
        ...style('contentCard', this.setup),
        background: cardColor,
      };
    },
  },
  mounted() {
    // Set initial active feature based on defaultActiveId
    if (this.setup.defaultActiveId) {
      const index = this.setup.items.findIndex((item) => item.id === this.setup.defaultActiveId);
      if (index !== -1) {
        this.activeIndex = index;
      }
    }

    // Handle deep-linking via hash
    const hash = window.location.hash;
    if (hash.startsWith('#feature=')) {
      const featureId = hash.substring(9);
      const index = this.setup.items.findIndex((item) => item.id === featureId);
      if (index !== -1) {
        this.activeIndex = index;
      }
    }

    // Initialize indicator position
    // Keyboard navigation
    window.addEventListener('keydown', this.handleKeydown);
  },
  unmounted() {
    window.removeEventListener('keydown', this.handleKeydown);
  },
  methods: {
    style,
    onTabChange(index) {
      const featureId = this.setup.items[index].id;
      window.location.hash = `#feature=${featureId}`;
    },
    handleKeydown(event) {
      if (event.key === 'ArrowLeft') {
        this.activeIndex = Math.max(0, this.activeIndex - 1);
      } else if (event.key === 'ArrowRight') {
        this.activeIndex = Math.min(this.setup.items.length - 1, this.activeIndex + 1);
      }
    },
  },
};
</script>

<style scoped></style>
