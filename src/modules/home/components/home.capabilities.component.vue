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
        cta: { text: 'Learn More', link: '/' },
        image: '/images/feature-performance.png',
        reversed: false,
      },
      // ... more items
    ],
  }
-->
<template>
  <section id="capabilities" :style="sectionStyle">
    <v-container ref="capabilitiesContainer" :style="containerStyle">
      <v-row align="center" justify="center" class="px-0 py-8">
        <!-- Title Section -->
        <v-col v-if="setup.title" cols="12">
          <homeContentComponent :setup="setup"></homeContentComponent>
        </v-col>

        <!-- Navigation Tabs with Sliding Indicator -->
        <home-tabs v-model="activeIndex" :items="setup.items" :color-mode="setup.colorMode" @update:model-value="onTabChange" />

        <!-- Feature Content -->
        <!--
          CSS grid stack keeps all items rendered in a single grid cell so the
          container height matches the tallest item. Prevents vertical jump
          when switching tabs (see #3945).
        -->
        <v-col cols="12" class="pa-0 mt-1">
          <div class="capabilities-stack">
            <div
              v-for="(item, index) in setup.items"
              :key="item.id"
              class="capabilities-stack__item"
              :class="{ 'capabilities-stack__item--active': activeIndex === index }"
              :aria-hidden="activeIndex !== index"
            >
              <v-card :class="`${config.vuetify.theme.rounded}`" :flat="config.vuetify.theme.flat" :style="cardStyle" class="mx-3">
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
                    <div v-if="item.video" :class="`py-6`">
                      <video-player
                        :src="item.video.file"
                        :controls="false"
                        :poster="item.video.poster"
                        :background-color="item.video.background || setup.style?.video?.background || '#101115'"
                        :rounded="config.vuetify.theme.rounded"
                        :playback-rate="item.video.playbackRate || 1.0"
                        loop
                        muted
                        autoplay
                        fluid
                      />
                    </div>
                    <v-img
                      v-if="item.image"
                      :src="item.image"
                      :alt="item.title"
                      :class="`${config.vuetify.theme.rounded}`"
                      cover
                      eager
                      aspect-ratio="16/9"
                    ></v-img>
                  </v-col>
                </v-row>
              </v-card>
            </div>
          </div>
        </v-col>
      </v-row>
    </v-container>
  </section>
</template>

<script>
/**
 * Module dependencies.
 */
import { useTheme } from 'vuetify';
import { style, overlapStyle, colorModeStyle } from '../../../lib/helpers/theme';
import homeContentComponent from './utils/home.content.component.vue';
import HomeTabs from './utils/home.tabs.component.vue';
import VideoPlayer from './utils/home.videoplayer.component.vue';

/**
 * Component definition.
 */
export default {
  name: 'HomeCapabilitiesComponent',
  components: {
    homeContentComponent,
    HomeTabs,
    VideoPlayer,
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
      const hasCustomBg = this.setup?.style?.section?.background;
      const bgColor = this.variant === 'alternate' ? this.theme.current.colors.surface : this.theme.current.colors.background;
      return {
        ...style('section', this.setup),
        ...colorModeStyle(this.setup.colorMode),
        ...(hasCustomBg ? {} : { background: bgColor }),
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

<style scoped>
/*
 * Stack all capability items in a single grid cell so the container height
 * matches the tallest item. Prevents the vertical jump when switching tabs
 * (see #3945). Only the active item is visible; others stay in the layout
 * to keep the grid cell sized to the tallest child.
 */
.capabilities-stack {
  display: grid;
}

.capabilities-stack__item {
  grid-area: 1 / 1;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition:
    opacity 0.25s ease,
    visibility 0s linear 0.25s;
}

.capabilities-stack__item--active {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transition-delay: 0s;
}
</style>
