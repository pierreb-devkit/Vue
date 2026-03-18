<!--
  HomeTabsComponent
  =================
  Reusable tabs component with sliding liquid glass indicator.

  USAGE:
  <home-tabs
    :items="items"
    v-model="activeIndex"
    color="#fff"
    show-arrows
    @update:modelValue="onTabChange"
  />

  PROPS:
  - items (Array, required): Array of tab items with { id, label, icon?, color? }
  - modelValue (Number): Active tab index (v-model)
  - intensity (Number): Liquid glass intensity (default: 1)
  - tint (String|Number): Liquid glass tint, 'auto' or -1 to 1 (default: 'auto')
  - color (String): Default text color for all buttons (default: theme onSurface)
  - colorMode (String): 'light' | 'dark' | null — force text color mode
  - All v-tabs props (show-arrows, align-tabs, etc.)

  EVENTS:
  - update:modelValue: Emitted when active tab changes

  EXAMPLE (items with per-item color):
  const items = [
    { id: 'tab1', label: 'First Tab', icon: 'fa-solid fa-home', color: '#fff' },
    { id: 'tab2', label: 'Second Tab', icon: 'fa-solid fa-star' },
  ]
-->
<template>
  <v-card ref="tabsContainer" class="tabs-container">
    <div v-if="!showArrows" class="sliding-indicator" :style="indicatorStyle"></div>
    <v-tabs :model-value="modelValue" class="custom-tabs" show-arrows v-bind="$attrs" @update:model-value="(val) => $emit('update:modelValue', val)">
      <v-tab
        v-for="(item, index) in items"
        :key="item.id"
        :ref="(el) => setBtnRef(el, index)"
        :value="index"
        :style="tabStyle(index)"
        class="rounded-pill"
      >
        <div v-if="showArrows && modelValue === index" class="tab-indicator" :style="tabIndicatorStyle"></div>
        <v-icon v-if="item.icon" :icon="item.icon" size="small" class="mr-2"></v-icon>
        <span class="text-no-wrap">{{ item.label }}</span>
      </v-tab>
    </v-tabs>
  </v-card>
</template>

<script>
/**
 * Module dependencies.
 */
import { useTheme } from 'vuetify';
import { liquidGlassStyle, colorModeStyle } from '../../../../lib/helpers/theme';

/**
 * Component definition.
 */
export default {
  name: 'HomeTabsComponent',
  inheritAttrs: false,
  props: {
    items: {
      type: Array,
      required: true,
    },
    modelValue: {
      type: Number,
      default: 0,
    },
    intensity: {
      type: Number,
      default: 1,
    },
    tint: {
      type: [String, Number],
      default: 'auto',
    },
    color: {
      type: String,
      default: null,
    },
    // Force text color mode: 'light' (white text), 'dark' (dark text), or null (auto)
    colorMode: {
      type: String,
      default: null,
      /**
       * Validates the colorMode prop value.
       * @param {string|null} value - The color mode to validate.
       * @returns {boolean} True if the value is null, 'light', or 'dark'.
       */
      validator: (value) => value === null || ['light', 'dark'].includes(value),
    },
  },
  emits: ['update:modelValue'],
  data() {
    const theme = useTheme();
    return {
      theme,
      btnRefs: [],
      indicatorPos: { left: 0, width: 0 },
      showArrows: false,
    };
  },
  computed: {
    themeName() {
      return this.theme.name;
    },
    computedTint() {
      if (this.tint === 'auto') return 'auto';
      return this.tint;
    },
    indicatorStyle() {
      return {
        ...liquidGlassStyle({
          vuetifyTheme: this.theme,
          intensity: this.intensity,
          tint: this.computedTint,
          border: 'none',
        }),
        position: 'absolute',
        top: '50%',
        transform: 'translateY(-50%)',
        left: `${this.indicatorPos.left}px`,
        width: `${this.indicatorPos.width}px`,
        height: '44px',
        transition: 'left 0.3s ease, width 0.3s ease',
        pointerEvents: 'none',
      };
    },
    tabIndicatorStyle() {
      return {
        ...liquidGlassStyle({
          vuetifyTheme: this.theme,
          intensity: this.intensity,
          tint: this.computedTint,
          border: 'none',
        }),
        position: 'absolute',
        inset: 0,
        borderRadius: '30px',
        pointerEvents: 'none',
      };
    },
  },
  watch: {
    modelValue() {
      this.$nextTick(() => {
        this.updateIndicator();
        this.checkOverflow();
      });
    },
    items() {
      this.$nextTick(() => {
        this.updateIndicator();
        this.checkOverflow();
      });
    },
  },
  mounted() {
    this.$nextTick(() => {
      this.updateIndicator();
      // Attendre un peu plus longtemps pour que Vuetify calcule l'overflow
      setTimeout(() => {
        this.checkOverflow();
      }, 100);
    });
    window.addEventListener('resize', () => {
      this.updateIndicator();
      this.checkOverflow();
    });
  },
  unmounted() {
    window.removeEventListener('resize', this.updateIndicator);
  },
  methods: {
    /**
     * Computes the inline style for a tab at the given index.
     * @param {number} index - The tab index.
     * @returns {Object} Style object with color, opacity, and transition.
     */
    tabStyle(index) {
      const item = this.items[index];
      const isSelected = this.modelValue === index;
      const colorModeColor = colorModeStyle(this.colorMode)?.color;
      return {
        color: item.color || this.color || colorModeColor || this.theme.current.colors.onSurface,
        opacity: isSelected ? 1 : 0.7,
        transition: 'opacity 0.3s ease',
      };
    },
    setBtnRef(el, index) {
      if (el) this.btnRefs[index] = el.$el || el;
    },
    checkOverflow() {
      this.$nextTick(() => {
        const container = this.$refs.tabsContainer?.$el || this.$refs.tabsContainer;
        const slideGroup = container?.querySelector('.v-slide-group');
        this.showArrows = slideGroup?.classList.contains('v-slide-group--is-overflowing') || false;
      });
    },
    updateIndicator() {
      const btn = this.btnRefs[this.modelValue];
      if (btn && this.$refs.tabsContainer) {
        const container = this.$refs.tabsContainer.$el || this.$refs.tabsContainer;
        const containerRect = container.getBoundingClientRect();
        const btnRect = btn.getBoundingClientRect();

        // Le sliding indicator est positionné par rapport à la v-card (container)
        // On calcule donc la position du bouton par rapport à la v-card
        this.indicatorPos = {
          left: btnRect.left - containerRect.left,
          width: btnRect.width,
        };
      }
    },
  },
};
</script>

<style scoped>
.tabs-container {
  position: relative;
  padding: 8px;
  background: transparent !important;
  box-shadow: none !important;
  border: none !important;
}

.tabs-container :deep(.v-card__underlay) {
  display: none;
}

.custom-tabs :deep(.v-tab) {
  position: relative;
  z-index: 1;
  color: var(--tabs-color);
  text-transform: none;
  letter-spacing: normal;
  min-width: auto;
  margin: 0 4px;
  font-size: 1rem;
  font-weight: 500;
}

/* Désactiver tous les styles par défaut de sélection de v-tab */
.custom-tabs :deep(.v-tab.v-tab--selected) {
  background: transparent !important;
  box-shadow: none !important;
}

.custom-tabs :deep(.v-tab__slider) {
  display: none;
}

.custom-tabs :deep(.v-tab .v-btn__overlay) {
  display: none;
}

.custom-tabs :deep(.v-tab .v-ripple__container) {
  display: none;
}

.custom-tabs :deep(.v-tabs__container) {
  justify-content: center;
}

.sliding-indicator {
  z-index: 0;
  border-radius: 30px;
}

.tab-indicator {
  z-index: -1;
}

</style>
