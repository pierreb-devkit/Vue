# Component Catalog

## Discovery

Before creating new components, scan existing ones:

```bash
# List all stack components
find src/modules/*/components -name "*.vue" | sort
# List all views
find src/modules/*/views -name "*.vue" | sort
```

## Home sections (config-driven)

Home sections render based on the `config.home.*` object. Set a section to `null` to hide it.

To discover available sections and their variants, read `src/modules/home/views/home.view.vue` — it imports and renders all sections conditionally based on config.

### Section variant system

Sections support a `variant` prop that controls background alternation:
- `default` — uses `config.pages.style.section.background` (typically `background` token)
- `alternate` — uses `config.pages.style.card.background` (typically `surface` token)
- `blur` — animated gradient background (config: `blur.light/dark.backgroundColors`, `haloColors`)

### Adding content to existing sections

Prefer extending config over creating new components:

```javascript
// In config.<project>.js
home: {
  services: {
    icon: 'fa-solid fa-code',
    title: 'Projects',
    alignment: 'center',
    variant: 'default',
    content: [
      {
        serviceIcon: 'fa-solid fa-rocket',
        color: '#2563eb',
        subtitle: 'My Project',
        text: 'Description with **markdown** support.',
      },
    ],
  },
}
```

## Module pattern

Each module follows:
```
src/modules/{name}/
├── components/       # {module}.{name}.component.vue
├── views/            # {module}.{name}.view.vue (route targets)
├── stores/           # Pinia stores
├── config/           # config.development.js, config.<env>.js
├── router/           # Route definitions
└── tests/            # Vitest tests
```

## Key Vuetify 4 components

Layout: `v-app`, `v-main`, `v-container`, `v-row`, `v-col`, `v-sheet`, `v-responsive`
Navigation: `v-app-bar`, `v-navigation-drawer`, `v-tabs`, `v-tab`, `v-breadcrumbs`
Content: `v-card`, `v-list`, `v-chip`, `v-avatar`, `v-img`, `v-icon`, `v-badge`
Input: `v-btn`, `v-text-field`, `v-textarea`, `v-select`, `v-checkbox`, `v-switch`, `v-form`
Feedback: `v-dialog`, `v-snackbar`, `v-progress-linear`, `v-progress-circular`, `v-skeleton-loader`
Data: `v-data-table`, `v-data-iterator`, `v-virtual-scroll`, `v-pagination`
Misc: `v-tooltip`, `v-menu`, `v-divider`, `v-empty-state`, `v-expansion-panel`
