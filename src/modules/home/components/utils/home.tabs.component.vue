<!--
  HomeTabsComponent
  =================
  Reusable tabs component with sliding liquid glass indicator.

  USAGE:
  <home-tabs
    :items="items"
    v-model="activeIndex"
    @update:modelValue="onTabChange"
  />

  PROPS:
  - items (Array, required): Array of tab items with { id, label, icon? }
  - modelValue (Number): Active tab index (v-model)
  - intensity (Number): Liquid glass intensity (default: 1)
  - tint (String|Number): Liquid glass tint, 'auto' or -1 to 1 (default: 'auto')

  EVENTS:
  - update:modelValue: Emitted when active tab changes

  EXAMPLE:
  const items = [
    { id: 'tab1', label: 'First Tab', icon: 'fa-solid fa-home' },
    { id: 'tab2', label: 'Second Tab', icon: 'fa-solid fa-star' },
  ]
-->
<template>
  <div ref="tabsContainer" class="tabs-container">
    <div class="sliding-indicator" :style="indicatorStyle"></div>
    <v-btn
      v-for="(item, index) in items"
      :key="item.id"
      :ref="(el) => setBtnRef(el, index)"
      variant="plain"
      :class="['tab-btn', 'mx-1', 'rounded-pill']"
      size="large"
      :style="btnStyle(index)"
      :ripple="false"
      @click="selectTab(index)"
    >
      <v-icon v-if="item.icon" :icon="item.icon" size="small" class="mr-2"></v-icon>
      <span class="text-no-wrap">{{ item.label }}</span>
    </v-btn>
  </div>
</template>

<script>
/**
 * Module dependencies.
 */
import { useTheme } from 'vuetify';
import { liquidGlassStyle } from '../../../../lib/helpers/theme';

/**
 * Component definition.
 */
export default {
  name: 'HomeTabsComponent',
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
  },
  emits: ['update:modelValue'],
  data() {
    const theme = useTheme();
    return {
      theme,
      btnRefs: [],
      indicatorPos: { left: 0, width: 0 },
    };
  },
  computed: {
    themeName() {
      return this.theme.global.name.value;
    },
    computedTint() {
      if (this.tint === 'auto') {
        return this.themeName === 'dark' ? 0.75 : -0.5;
      }
      return this.tint;
    },
    indicatorStyle() {
      return {
        ...liquidGlassStyle({
          vuetifyTheme: this.theme,
          intensity: this.intensity,
          tint: this.computedTint,
          variant: 'pill',
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
  },
  watch: {
    modelValue() {
      this.$nextTick(() => this.updateIndicator());
    },
    items() {
      this.$nextTick(() => this.updateIndicator());
    },
  },
  mounted() {
    this.$nextTick(() => this.updateIndicator());
    window.addEventListener('resize', this.updateIndicator);
  },
  unmounted() {
    window.removeEventListener('resize', this.updateIndicator);
  },
  methods: {
    btnStyle(index) {
      return {
        color: this.theme.current.colors.onSurface,
        opacity: this.modelValue === index ? 1 : 0.7,
        transition: 'opacity 0.3s ease',
      };
    },
    setBtnRef(el, index) {
      if (el) this.btnRefs[index] = el.$el || el;
    },
    updateIndicator() {
      const btn = this.btnRefs[this.modelValue];
      if (btn && this.$refs.tabsContainer) {
        const container = this.$refs.tabsContainer;
        const containerRect = container.getBoundingClientRect();
        const btnRect = btn.getBoundingClientRect();
        this.indicatorPos = {
          left: btnRect.left - containerRect.left,
          width: btnRect.width,
        };
      }
    },
    selectTab(index) {
      if (this.modelValue !== index) {
        this.$emit('update:modelValue', index);
      }
    },
  },
};
</script>

<style scoped>
.tabs-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  flex-wrap: wrap;
  gap: 4px;
}

.tab-btn {
  position: relative;
  z-index: 1;
}

.sliding-indicator {
  z-index: 0;
}
</style>
