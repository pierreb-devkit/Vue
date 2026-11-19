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

This skill is an **enforcer** of the design system (Vuetify 4 + MD3 + theme helpers) **and a craft baseline** — the "Beauty pass" below is teachable, encodable craft (not taste-by-vibes), the difference between *correct* and *beautiful*. Net-new brand identity (a bold landing aesthetic, a new visual language) still belongs to creative direction outside this skill; the Beauty pass makes the everyday output stop looking generic.

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
- **CSS last resort**: Prefer in order: Vuetify props (`flat`, `elevation`, `variant`, `density`, `max-width`) → Vuetify utility classes (`pa-0`, `d-flex`, `d-sr-only`, `border-t`, `opacity-60`, `cursor-pointer`, `text-mono`, `bg-transparent`) → Vuetify transitions (`v-fade-transition`, `v-scale-transition`) → `<style scoped>` only for a case on the list below
- **Reuse**: Check existing components before creating new ones
- **Verify**: Screenshot desktop+mobile, light+dark after visual changes

## No custom CSS, except

Write CSS (a `<style>` block or an inline style object) only for these cases, and say which one in a comment when it is not obvious. Vuetify utilities sit in a CSS layer without `!important`, so a scoped rule always beats them: when you swap a rule for a class, delete the rule.

- **Keyframe animations**, each with a `@media (prefers-reduced-motion: reduce)` guard that shows the end state.
- **Liquid glass and masks** (`backdrop-filter`, `mask-composite`): through `liquidGlassStyle()`, colours from theme tokens.
- **Rendered markdown** (marked output cannot take classes): wrap it in `CoreProseComponent`, the one prose sheet; a page adds only what is its own.
- **Print** (`@media print`).
- **Runtime geometry**: sizes, offsets or positions computed from props or the DOM.
- **Config style helpers**: `style()`, `overlapStyle()`, `colorModeStyle()`, `sectionStyles()` (home sections).
- **Sign-in brand buttons** (each provider's own colours).
- **Layout details with no utility**: `font-variant-numeric`, flex `min-width: 0`, `scroll-margin-top`, a sticky offset, `white-space: pre-line`, the footer position.
- **Avatar identity colours**: `hashColor()` and `avatarTextClass()` from `lib/helpers/orgColor.js`, one palette.

## Beauty pass (correct → beautiful)

Consistency + accessibility make a UI *correct*; these seven rules make it *beautiful*. Each is a checkable rule with a named failure mode — the inverse of each is exactly what makes a layout read as generic. Apply on every visual surface; they need **no bespoke CSS** (Vuetify props, spacing classes, elevation, and theme tokens carry all seven). Deeper config levers to push past the generic Material look: `references/design-system.md` § "Beauty levers".

1. **Whitespace first, then reduce.** Start generous, don't fill the viewport; cramped padding is the #1 generic tell. Lean on `pa-6`/`pa-8`, section `py-12`+. Context-calibrate: dense dashboards tighten, but never start cramped.
2. **Hierarchy by weight + color, not size alone.** Cap ~3 type sizes per view; de-emphasize secondary/tertiary with a lighter `text-medium-emphasis` / muted color, not just smaller. Size-only hierarchy is a slop signature.
3. **Spacing on the fixed scale only.** Use the spacing classes (steps `0`→`16` = 4→64px); never an arbitrary inline `margin: 13px`. Off-scale spacing reads ad-hoc.
4. **Color reserved for emphasis.** Mostly-neutral base (tinted greys via `surface`/`background`, not pure grey); `primary` for the ONE action that matters, not spread across the screen. Even color spread = the default-Material generic look. Never grey text on a colored background.
5. **Depth = soft, two-part elevation.** Prefer low `elevation-1`/`elevation-2` (Vuetify's shadows are already the layered contact+ambient pair) or `elevation-0` + a subtle `surface` border; overlap elements to layer. One harsh high-contrast shadow reads cheap.
6. **Proximity groups related items** (Gestalt). A field label sits tight to its input; a card's title/body/action cluster with less gap inside than between cards. Uniform spacing everywhere destroys grouping.
7. **Restraint over decoration.** Fewer weights, one accent, generous rhythm — boring-and-consistent beats clever-and-busy. Delete an element before adding one.

> These seven rules are the canonical craft baseline: name the visual intent when planning a surface, apply the rules while building, and score the rendered result against them in QA. This skill is where they're authored.

## Anti-patterns

- Vuetify 2 type classes (gone in Vuetify 4, the text renders unstyled) → use MD3: `text-h1`..`text-h6` → `text-display-*` / `text-headline-*`; `text-subtitle-1/2` → `text-title-medium` / `text-title-small`; `text-body-1` → `text-body-large`; `text-body-2` → `text-body-medium`; `text-caption` → `text-body-small`; `text-overline` / `text-button` → `text-label-small` / `text-label-large`
- `!important` in a global `<style>` (it beats Vuetify's layered styles and the props) → a theme config key or a Vuetify `defaults` entry
- Hand-wired `:flat` / `:class="config.vuetify.theme.rounded"` on a `v-card` → the card already gets both from the Vuetify `defaults`
- Hardcoded colors in templates → use theme variables
- New components for things existing ones already handle
- Ignoring dark mode
- Skipping visual verification
- Custom CSS when a Vuetify prop/class/transition covers the need
- **Generic-look tells** (Beauty pass inverses): cramped padding · hierarchy by size alone · color spread evenly instead of reserved for emphasis · one harsh shadow · arbitrary off-scale spacing · pure untinted greys · grey text on colored backgrounds
