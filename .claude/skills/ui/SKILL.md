---
name: ui
description: >
  Design system reference for the Devkit Vue stack (Vuetify 4 + custom theme helpers).
  Use when asked about styling, theming, layout, design system, Vuetify components, visual verification, or UI patterns.
  Automatically consumed by /feature when the task has a visual component.
  Can also be invoked directly for design-only tasks (restyle, theme change, layout fix).
---

# UI

Design system reference and visual quality guidelines for the Devkit Vue stack.

**This is not a standalone workflow.** For full feature implementation, use `/feature` which automatically applies these guidelines when visual work is involved.

Invoke `/ui` directly only for pure design tasks (restyle, theme change, layout fix) that don't need the full `/feature` workflow.

## Design thinking

Before any visual work, read the [Anthropic frontend-design guidelines](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md) for design thinking, typography, color, motion, spatial composition, and anti-patterns. Apply those principles, then constrain with the stack's design system below.

## References

| What | File | Content |
|------|------|---------|
| Tokens, typography, spacing, breakpoints | `references/design-system.md` | Vuetify 4 MD3 classes, theme CSS variables, config paths |
| Component catalog | `references/components.md` | Home sections, core layout, module pattern, key Vuetify components |
| Theme helpers & code patterns | `references/patterns.md` | `liquidGlassStyle()`, `style()`, `overlapStyle()`, AOS, responsive |
| Visual verification | `references/verification.md` | Puppeteer screenshot flow, review checklist |

## Key rules (quick reminder)

- **Typography**: MD3 classes only (`text-display-large`, NOT `text-h1`). Responsive: `text-display-small text-sm-display-medium`
- **Colors**: Theme tokens via config or CSS variables (`rgb(var(--v-theme-primary))`), never hardcoded hex in templates
- **Dark/light**: Everything must work in both modes
- **Config-driven**: Prefer config options over hardcoded values
- **CSS last resort**: Prefer in order: Vuetify props (`flat`, `elevation`, `variant`, `density`) → Vuetify utility classes (`pa-0`, `d-flex`) → Vuetify transitions (`v-fade-transition`, `v-scale-transition`) → `<style scoped>` only if no Vuetify alternative exists
- **Reuse**: Check existing components before creating new ones
- **Verify**: Screenshot desktop+mobile, light+dark after visual changes

## Anti-patterns

- `text-h1`..`text-h6` → use MD3: `text-display-large`, `text-headline-medium`
- Hardcoded colors in templates → use theme variables
- New components for things existing ones already handle
- Ignoring dark mode
- Skipping visual verification
- Custom CSS when a Vuetify prop/class/transition covers the need
