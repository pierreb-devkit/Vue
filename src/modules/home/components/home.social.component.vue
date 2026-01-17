<!--
  HomeSocialComponent
  ===================
  Infinite horizontal scrolling logos showcase with company names.
  Perfect for displaying trusted brands, partners, or clients.

  USAGE:
  <homeSocialComponent :setup="config.home.social" />

  CONFIG EXAMPLE (setup object):
  social: {
    title: 'Recommended by startups worldwide',
    style: {
      logoHeight: '60px',
      scrollSpeed: 40,  // seconds for one complete scroll
    },
    content: [
      {
        img: '/images/partner01.webp',
        name: 'Comes.io',
        link: 'https://comes.io',
      },
      {
        img: '/images/partner02.webp',
        name: 'FoxDeluxe',
        link: 'https://foxdeluxe.com',
      },
    ],
  }
-->
<template>
  <section id="social" :style="sectionStyle">
    <v-container :style="containerStyle" class="py-8">
      <v-row align="center" justify="center">
        <v-col cols="12" md="9" lg="8">
          <v-row align="center" class="flex-column flex-sm-row">
            <v-col cols="12" sm="auto" class="text-center text-sm-start pb-0 pb-sm-3 mr-sm-8">
              <span class="text-body-1">{{ setup.title }}</span>
            </v-col>
            <v-col class="overflow-hidden scroll-wrapper">
              <div class="scroll-content d-flex ga-12" :style="scrollStyle">
                <!-- First set of logos -->
                <a
                  v-for="(item, index) in setup.content"
                  :key="`original-${index}`"
                  :href="item.link"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="logo-link text-decoration-none"
                >
                  <v-sheet class="d-flex align-center ga-3" color="transparent">
                    <v-img :src="item.img" :height="logoSize" :width="logoSize" cover :alt="item.name"></v-img>
                    <h3 class="text-h6 text-medium-emphasis font-weight-bold">{{ item.name }}</h3>
                  </v-sheet>
                </a>

                <!-- Duplicate set for seamless loop -->
                <a
                  v-for="(item, index) in setup.content"
                  :key="`duplicate-${index}`"
                  :href="item.link"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="logo-link text-decoration-none"
                >
                  <v-sheet class="d-flex align-center ga-3" color="transparent">
                    <v-img :src="item.img" :height="logoSize" :width="logoSize" cover :alt="item.name"></v-img>
                    <h3 class="text-h6 text-medium-emphasis font-weight-bold">{{ item.name }}</h3>
                  </v-sheet>
                </a>
              </div>
            </v-col>
          </v-row>
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
import { style, overlapStyle } from '../../../lib/helpers/theme';

/**
 * Export default
 */
export default {
  name: 'HomeSocialProofComponent',
  props: {
    setup: {
      type: Object,
      required: true,
    },
  },
  data() {
    const theme = useTheme();
    return {
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
        overflow: 'hidden',
        '--gradient-bg-color': bgColor,
      };
    },
    logoSize() {
      return this.setup.style?.logoHeight || '20px';
    },
    scrollSpeed() {
      return this.setup.style?.scrollSpeed || 40;
    },
    scrollStyle() {
      return {
        animationDuration: `${this.scrollSpeed}s`,
      };
    },
  },
};
</script>

<style scoped>
.scroll-wrapper {
  position: relative;
  min-height: 60px;
}

.scroll-wrapper::before,
.scroll-wrapper::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: 120px;
  z-index: 2;
  pointer-events: none;
}

.scroll-wrapper::before {
  left: 0;
  background: linear-gradient(to right, var(--gradient-bg-color) 0%, transparent 100%);
}

.scroll-wrapper::after {
  right: 0;
  background: linear-gradient(to left, var(--gradient-bg-color) 0%, transparent 100%);
}

.scroll-content {
  animation: scroll-left linear infinite;
  width: fit-content;
  align-items: center;
}

@keyframes scroll-left {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}
</style>
