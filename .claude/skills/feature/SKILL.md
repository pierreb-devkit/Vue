# Feature Skill

Implement a new feature following modularity rules.

## What it does

Guides feature implementation with a focus on modularity and isolation.

## Usage

Invoke this skill when implementing a new feature or modifying existing functionality.

## Steps

### 1. Identify target module(s)

Before coding, determine:

- Which module(s) does this feature belong to?
- Default to **ONE module** unless strictly necessary
- If it spans multiple modules, explain why and minimize coupling

### 2. Apply modularity rules

- **Isolate feature logic** inside the module boundary
- **Avoid cross-module imports** unless absolutely required
- If shared code is needed:
  - Place it in `helpers` or a shared layer
  - Provide **explicit justification** for why it must be shared
- Keep these inside the module (`src/modules/{module}/**`):
  - Components `src/modules/{module}/components/**`
  - Routes `src/modules/{module}/router/**`
  - Store/Pinia state `src/modules/{module}/stores/**`
  - API calls `src/modules/{module}/stores/**`
  - Types/interfaces `src/modules/{module}/stores/**`
  - Tests `src/modules/{module}/tests/**`
  - Views `src/modules/{module}/views/**`
- Follow `/naming` for all file and folder naming conventions

### 3. Implement the feature

Follow the stack's architecture:

- **Layered approach**: UI → Store → Services → API
- **Upper layers** are abstractions of lower ones
- **Each layer** references only the immediate lower layer
- Use Vue 3 Composition API
- Use Vuetify 3 components (check docs first)
- Follow existing patterns in the module

### 4. Add tests

- Tests go in `src/modules/{module}/tests/`
- Cover new components, services, and store logic
- Use Vitest and Vue Test Utils

### 5. Run verify (dedicated skill)

### 6. Provide summary

- ✅ Feature implemented in module: `{module-name}`
- 🔍 Cross-module coupling: `{none | explain if any}`
- ⚠️ Risks: `{any potential issues or trade-offs}`
- 📝 Next steps: `{manual testing, deployment considerations, etc.}`

## Modularity checklist

Before finishing, verify:

- [ ] Feature is isolated in ONE module (or justified if multiple)
- [ ] No new cross-module imports (or justified if required)
- [ ] Shared code (if any) is in `core` with clear justification
- [ ] Routes, components, store, services are in module folder
- [ ] Tests are in `src/modules/{module}/tests/`
- [ ] Linting passes
- [ ] Tests pass
- [ ] Build succeeds

## Example

Feature: "Add user avatar upload"

1. Target module: `users`
2. Changes:
   - Add `user.avatar.upload.component.vue` component in `src/modules/users/components/`
   - in the view in edit mode add `src/modules/users/views/`
   - Update user store in `src/modules/users/store/users.store.js`
   - Add tests in `src/modules/users/tests/`
3. No cross-module coupling
4. Run verify
5. Summary: Feature ready, isolated in `users` module

## Notes

- Follows existing code patterns
- Prioritizes simplicity over complexity
