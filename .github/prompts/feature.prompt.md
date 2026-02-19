# Feature

Read `ERRORS.md` first and avoid repeating listed mistakes.

Implement or modify a feature while preserving module boundaries.

## Steps

1. **Identify target module** — default to ONE module; justify explicitly if multiple are needed
2. **Implement within module boundary** (`src/modules/<module>/`)
   - Components: `components/`
   - Views: `views/`
   - Store: `stores/`
   - Router: `router/`
   - Tests: `tests/`
3. **Naming conventions**
   - Components: `{module}.{name}.component.vue`
   - Views: `{module}.{name}.view.vue`
   - Stores: `{module}.store.js`
   - Tests: `{target}.spec.js`
4. **Layer direction**: UI → Store → Services → API (each layer references only the one below)
5. **Add or update tests** in `src/modules/<module>/tests/`
6. **Verify**: `npm run lint`, `npm run test:unit`, `npm run build`

## Guardrails

- Never commit secrets (`.env*`, keys, tokens)
- No cross-module imports without explicit justification
- Keep changes merge-friendly for downstream projects

## Checklist before finishing

- [ ] Feature isolated in ONE module (or justified if multiple)
- [ ] No new cross-module imports (or justified)
- [ ] Tests added or updated
- [ ] Lint, tests, build pass
