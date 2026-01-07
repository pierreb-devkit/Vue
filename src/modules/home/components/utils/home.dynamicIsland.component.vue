<template>
  <section>
    <div :style="{ width: '260px', height: '56px', display: isFixed ? 'block' : 'none' }" class="mt-10"></div>
    <div :class="['dynamicIsland', { fixed: isFixed, expand: animate, minimize: !animate }]" class="mt-10" :style="dynamicIslandStyle">
      <div :class="['content', { fadeIn: animate, fadeOut: !animate }]">
        <div class="text-center font-weight-bold text-white">
          <span v-if="text && !steps" class="ml-4 mt-1 text-h6 text-truncate">{{ text }}</span>
          <span v-if="step !== null && steps !== null">
            <span
              v-for="index in stepsArray"
              :key="index"
              class="step"
              :class="{ active: step === index }"
              tabindex="0"
              @click="action(index)"
              @keyup.enter="action(index)"
            >
            </span>
          </span>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
/**
 * Module dependencies.
 */
import { useCoreStore } from '../../../core/stores/core.store';
/**
 * Component definition.
 */
export default {
  name: 'HomeDynamicIslandComponent',
  props: {
    container: {
      type: Object,
      default: null,
    },
    text: {
      type: String,
      default: '',
    },
    step: {
      type: Number,
      default: null,
    },
    steps: {
      type: Number,
      default: null,
    },
    action: {
      type: Function,
      default: () => {},
    },
  },
  data: () => ({
    isVisible: false,
    isFixed: false,
    animate: false,
    disabled: false,
    stepsArray: [],
  }),
  computed: {
    theme() {
      const coreStore = useCoreStore();
      return coreStore.theme;
    },
    dynamicIslandStyle() {
      return {
        filter: this.theme === 'dark' ? 'brightness(1.8)' : 'brightness(0.8)',
        'background-color': `${this.config.vuetify.theme.themes[this.theme].colors.background}80`,
        color: this.config.vuetify.theme.themes[this.theme].colors.onSurface,
        '-webkit-backdrop-filter': 'blur(8px)',
        'backdrop-filter': 'blur(8px)',
      };
    },
  },
  watch: {
    container: {
      immediate: true,
      handler(newValue) {
        if (newValue && newValue.$el && this.$el) {
          window.addEventListener('scroll', this.checkVisibility);
          this.checkVisibility();
        }
      },
    },
  },
  created() {
    for (let i = 0; i <= this.steps; i += 1) {
      this.stepsArray.push(i);
    }
  },
  beforeUnmount() {
    window.removeEventListener('scroll', this.checkVisibility);
  },
  methods: {
    checkVisibility() {
      const container = this.container.$el.getBoundingClientRect();
      const button = this.$el.querySelector('.dynamicIsland').getBoundingClientRect();
      const scrollDownTriger = (window.innerHeight / 3) * 2;
      const offset = 30;
      // Apparition : lorsque le container prend plus d'1/3 du viewport
      // console.log(this.text, 'this.animate', this.animate, 'container.top', container.top, 'scrollDownTriger', scrollDownTriger);
      if (!this.animate && container.top < scrollDownTriger) this.animate = true;
      // Positionnement fixe : lorsque le bouton est au dessus de 50 du bas du viewport
      if (this.animate && !this.isFixed && button.bottom >= window.innerHeight) this.isFixed = true;
      // Positionnement relative : lorsque le bas du button atteind le bas du container
      if (this.animate && this.isFixed && button.bottom >= container.bottom - offset) this.isFixed = false;
      // Disparition: move to top lorsque le bouton est fixe et que le container prend moins 1/3 du viewport
      if (this.animate && this.isFixed && container.top > scrollDownTriger) this.animate = false;
    },
    click(param) {
      this.disabled = true;
      this.action(param);
      setTimeout(() => {
        this.disabled = false;
      }, 400);
    },
  },
};
</script>

<style scoped>
@keyframes resize {
  0% {
    width: 56px;
    height: 56px;
  }
  50% {
    width: 50px;
    height: 50px;
  }
  100% {
    width: 56px;
    height: 56px;
  }
}

@keyframes expand {
  0% {
    width: 56px;
    height: 56px;
  }
  100% {
    width: 260px;
    height: 56px;
  }
}
@keyframes minimize {
  0% {
    width: 260px;
    height: 56px;
    opacity: 1;
  }
  50% {
    width: 56px;
    height: 56px;
    opacity: 1;
  }
  100% {
    width: 0px;
    height: 0px;
    opacity: 0;
  }
}

.dynamicIsland {
  display: block;
  width: 56px;
  height: 56px;
  border-radius: 30px;
  transform-origin: center;
  opacity: 0;
}

.dynamicIsland.expand {
  opacity: 1;
  animation: expand 0.5s forwards 0.5s;
}

.dynamicIsland.minimize {
  animation: minimize 0.5s;
}

.dynamicIsland.fixed {
  position: fixed;
  bottom: auto;
  left: 50%;
  bottom: 30px;
  transform: translate(-50%, 0);
}

.dynamicIsland .content {
  opacity: 0;
  height: 56px;
  width: 260px;
  display: table-cell;
  vertical-align: middle;
}

.dynamicIsland .content.fadeIn {
  transition: opacity 0.1s;
  transition-delay: 0.8s; /* 1s pour bounce + 0.1s pour expand */
  opacity: 1;
}
.dynamicIsland .content.fadeOut {
  transition: opacity 0.1s;
  opacity: 0;
}

.dynamicIsland .step {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 6px;
  background-color: rgb(var(--v-theme-onBackground));
  margin: 8px;
  margin-top: 12px;
  transition: width 0.3s ease-in-out;
  box-sizing: border-box; /* Assure que le padding est inclus dans la largeur/hauteur */
  cursor: pointer;
}

.dynamicIsland .step.active {
  width: 70px; /* Augmente la largeur */
}

.dynamicIsland .step:last-child.active {
  margin-left: calc(auto + 8px);
}
</style>
