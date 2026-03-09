# Theme Helpers & Patterns

## Theme helpers (`src/lib/helpers/theme.js`)

### `isDark(theme)`

Detect current theme mode.

```javascript
import { isDark } from '@/lib/helpers/theme.js';
const dark = isDark(config.vuetify.theme.dark); // true/false
// 'auto' respects system preference via prefers-color-scheme
```

### `style(kind, object)`

Extract CSS object from config style definitions. Handles hex colors and Vuetify theme variable references.

```javascript
import { style } from '@/lib/helpers/theme.js';

// In component
const sectionStyle = style('section', config.pages);
// If config.pages.style.section.background = 'background'
// Returns: { background: 'rgb(var(--v-theme-background)) !important' }

// If config.pages.style.section.background = '#ff0000'
// Returns: { background: '#ff0000' }
```

Supported properties: `background`, `color`, `height`, `width`, `borderRadius`.

### `liquidGlassStyle(options)`

Generate glassmorphism effect. The stack's signature visual style.

```javascript
import { liquidGlassStyle } from '@/lib/helpers/theme.js';
import { useTheme } from 'vuetify';

const theme = useTheme();
const glassStyle = liquidGlassStyle({
  vuetifyTheme: theme,    // Required: auto-extracts colors
  intensity: 0.8,          // 0 = flat, 1 = strong glass
  tint: 'auto',            // 'auto', or -1 to 1
  opacity: undefined,      // Override opacity (useful for headers)
  variant: 'card',         // 'card' (16px radius), 'pill' (9999px), 'header' (0)
  border: 'all',           // 'all', 'bottom', 'top', 'none'
  glowBorder: false,       // false, true (static), 'animated' (rotating)
});
```

**How it works**:
- Backdrop blur (6-18px based on intensity)
- Saturate + contrast filters
- Surface-colored highlight gradient (top)
- Theme-aware borders and shadows
- Auto-adjusts for light/dark mode

### `overlapStyle(overlap, display)`

Slide a section up into the previous one (negative margin).

```javascript
import { overlapStyle } from '@/lib/helpers/theme.js';

// In template with Vuetify display
const { display } = useDisplay();
const overlap = overlapStyle(config.home.capabilities.overlap, display);
// Mobile: margin-top: -18vh, Desktop: margin-top: -35vh
```

### `colorModeStyle(colorMode)`

Force text color regardless of theme.

```javascript
import { colorModeStyle } from '@/lib/helpers/theme.js';
const headerText = colorModeStyle('light'); // { color: '#ffffff' }
const darkText = colorModeStyle('dark');    // { color: 'rgba(0,0,0,0.87)' }
const auto = colorModeStyle(null);          // {} (inherits from theme)
```

### `lightenColor(hex, percent)`

Adjust hex color brightness.

```javascript
import { lightenColor } from '@/lib/helpers/theme.js';
lightenColor('#1abc9c', 20); // Lighter shade as hex
```

## Common patterns

### Config-driven section

```vue
<template>
  <v-container v-if="config.home.mySection" :style="sectionStyle">
    <h2 class="text-display-small text-sm-display-medium">
      {{ config.home.mySection.title }}
    </h2>
  </v-container>
</template>

<script setup>
import config from '@/config';
import { style } from '@/lib/helpers/theme.js';

const sectionStyle = style('section', config.pages);
</script>
```

### Alternating section backgrounds

Sections alternate between `background` and `surface` tokens:
- `variant: 'default'` → `background` color
- `variant: 'alternate'` → `surface` color
- `variant: 'blur'` → animated gradient

### Glass card

```vue
<template>
  <div :style="glassStyle">
    <slot />
  </div>
</template>

<script setup>
import { liquidGlassStyle } from '@/lib/helpers/theme.js';
import { useTheme } from 'vuetify';

const theme = useTheme();
const glassStyle = liquidGlassStyle({ vuetifyTheme: theme });
</script>
```

### Responsive layout

```vue
<v-container>
  <v-row>
    <v-col cols="12" sm="6" md="4">
      <!-- 1 col mobile, 2 cols tablet, 3 cols desktop -->
    </v-col>
  </v-row>
</v-container>
```

### AOS scroll animations

```vue
<div data-aos="fade-up" data-aos-delay="100" data-aos-duration="800">
  Content revealed on scroll
</div>
```

Available effects: `fade-up`, `fade-down`, `fade-left`, `fade-right`, `zoom-in`, `zoom-out`, `flip-up`.

### Markdown content rendering

```vue
<div v-html="$markdown.render(content)" class="text-body-large" />
```

### Dark mode-aware custom styles

```vue
<script setup>
import { useTheme } from 'vuetify';
const theme = useTheme();
const isDark = computed(() => theme.global.name.value === 'dark');
</script>
```
