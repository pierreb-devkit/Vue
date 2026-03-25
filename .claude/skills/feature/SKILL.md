---
name: feature
description: Implement a new feature or modify existing functionality. Use when asked to implement, add, build, create, or modify a feature, page, component, or module. Includes scope analysis, edge case detection, module scaffolding, implementation with UI quality, and verification.
---

# Feature Skill

## Phase 0 — Scope Analysis (interactive, before coding)

### 1. Identify target module

- Which module? Default to **ONE** unless justified.
- **If the module doesn't exist** → run `/create-module` to scaffold it first, then continue.

### 2. Analyze flows & edge cases

For each user-facing flow this feature creates or modifies, identify:

- **Happy path** — standard success scenario
- **Error path** — what fails, what does the user see?
- **"Last one" edge** — last owner, last org, last member
- **Retry edge** — can the user retry after failure/rejection?
- **Multi-user impact** — who else is affected?

### 3. Check completeness

- Will every backend API endpoint have a corresponding UI?
- Every UI action has visible feedback (success + error)
- Feature works without mailer / without organizations enabled

### 4. Present plan & ask questions

**STOP and present to the user:**
- Flows identified (happy + error + edge cases)
- UI elements needed
- Open questions or scope decisions

**Wait for user validation before coding.**

## Phase 1 — Implementation

### 5. Module structure

Follow layered approach: **UI → Store → API**. Each layer references only the one below.

- Use Vue 3 Composition API + Vuetify 4
- Follow `/naming` conventions
- Follow existing module patterns

### 6. UI rules

**If the feature has visual components**, apply `/ui` skill guidelines (design-system, components, patterns references).

**Feedback:**
- No `console.log(err)` in catch blocks — the axios interceptor handles snackbar display
- Use `catch { /* interceptor handles */ }` or re-throw

**Destructive actions — confirmation proportional to impact:**
- Low impact (remove member): simple confirm dialog
- High impact (delete org/account): type-to-confirm with entity name

**Consistency** (see `/ui` patterns):
- Dialogs: `max-width="440"`
- Destructive buttons: `color="error"` + `variant="tonal"` (inline) or `variant="flat"` (in dialog)
- Primary buttons: `color="primary"` + `variant="flat"` + `class="text-none text-body-medium"`
- All buttons: `:class="config.vuetify.theme.rounded"`
- Role chips: `roleColor()` + `variant="tonal"` + `size="small"` + `class="text-capitalize"`

**Responsive:**
- Side-by-side layouts: `flex-column flex-sm-row`
- Data tables: hide non-essential columns on `smAndDown`
- Form buttons: `:block="$vuetify.display.xs"` or flex-wrap

**State & UX guards:**
- Forms with dirty flag → `beforeRouteLeave` guard
- Dismissible banners → persist in `sessionStorage`, not component data
- Active context → visually indicate (badge, border, chip)
- Generated links/tokens → copy button with clipboard API
- Dates: relative for recent ("2d ago"), absolute for historical ("DD/MM/YY")

## Phase 2 — Definition of Done

### 7. Self-review checklist

**Flow completeness:**
- [ ] Every API has a UI, every action shows feedback
- [ ] Destructive actions have appropriate confirmation
- [ ] Edge cases handled (last-one, retry, no mailer)

**Consistency:**
- [ ] Dialog widths, button styles, chips follow rules above
- [ ] Responsive layout verified at mobile breakpoint

**State:**
- [ ] Unsaved changes guarded
- [ ] Dismissible UI persisted correctly
- [ ] Active context visually marked

**Modularity:**
- [ ] Isolated in ONE module (or justified)
- [ ] No cross-module Store imports except `useAuthStore`/`useCoreStore`
- [ ] Tests added
- [ ] Tests: unit tests (`*.unit.tests.js`) for all changes. E2E (`*.e2e.tests.js`) only if the change affects a critical user flow (auth, org onboarding, invite/join).

### 7b. Elegance check

For non-trivial changes: pause and ask yourself "is there a simpler or more elegant approach?" If the current implementation feels hacky, refactor before proceeding.

### 8. Run `/verify`

### 9. Run `/pull-request`
