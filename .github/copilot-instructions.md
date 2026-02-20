# Devkit Vue - Copilot Instructions

## Preflight

- Read `ERRORS.md` before proposing changes or code reviews
- If a new recurring mistake occurs, append one line to `ERRORS.md` using `[YYYY-MM-DD] <scope>: <wrong> -> <right>`

## Canonical commands

- Dev: `npm run dev`
- Build: `npm run build`
- Preview: `npm run preview`
- Tests: `npm test` (watch) or `npm run test:unit`
- Coverage: `npm run test:coverage`
- Lint: `npm run lint`
- Lint fix: `npm run lint:fix`
- Format: `npm run format`
- Generate config: `npm run generateConfig`
- Commit: `npm run commit`

## Available prompts

Use `.github/prompts/*.prompt.md` for guided workflows:

| Task | Prompt file |
| ---- | ----------- |
| Verify | `.github/prompts/verify.prompt.md` |
| Feature | `.github/prompts/feature.prompt.md` |
| Create module | `.github/prompts/create-module.prompt.md` |
| Update stack | `.github/prompts/update-stack.prompt.md` |
| Naming | `.github/prompts/naming.prompt.md` |

## Always-on guardrails

- Never commit secrets or credentials (`.env*`, `secrets/**`, keys, tokens)
- Do not introduce cross-module coupling without explicit justification
- Avoid risky renames or moves of core stack paths used by downstream merges
- Keep changes minimal and merge-friendly for downstream projects
- Flag security or mergeability risks explicitly in reviews

## Architecture and modularity

- Keep features inside one module by default: `src/modules/<module>/`
- Respect layered direction: UI -> Store -> Services -> API
- Keep config, routes, store, and business logic inside module boundaries
- Place justified shared code in `src/modules/core`
- Keep tests in `src/modules/*/tests/`

## Naming conventions

- Folders: kebab-case
- Components: `{module}.{name}.component.vue`
- Views: `{module}.{name}.view.vue`
- Stores: `{module}.store.js`
- Routers: `{module}.router.js`
- Tests: `{target}.spec.js`

## Definition of done

- `npm run lint` passes
- `npm run test:unit` passes
- `npm run build` passes
- Cross-module impact is documented and justified when present
