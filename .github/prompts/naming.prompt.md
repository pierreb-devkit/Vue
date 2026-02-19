# Naming

Read `ERRORS.md` first and avoid repeating listed mistakes.

Audit or apply file and folder naming conventions.

## Conventions

| Type | Pattern | Example |
| ---- | ------- | ------- |
| Component | `{module}.{name}.component.vue` | `home.hero.component.vue` |
| View | `{module}.{name}.view.vue` | `auth.signin.view.vue` |
| Store | `{module}.store.js` | `tasks.store.js` |
| Router | `{module}.router.js` | `users.router.js` |
| Test | `{target}.spec.js` | `home.store.spec.js` |
| Helper / Service / Plugin | `{name}.js` | `tools.js` |

- Folders: **kebab-case**
- Utility sub-components: `components/utils/{module}.{name}.component.vue`
- `src/lib/` files: simple names, no module prefix

## Case in code

| Context | Convention | Example |
| ------- | ---------- | ------- |
| Variable / function | lowerCamelCase | `useHomeStore` |
| Component name (JS) | PascalCase | `HomeHeroComponent` |
| Store export | `use{Module}Store` | `useTasksStore` |
| Constant / env key | UPPER_SNAKE_CASE | `MY_MODULE_KEY` |

## Steps

1. Identify the module and file types involved
2. Check each file against the table above
3. Report mismatches with the expected name
4. Apply renames if requested
5. Verify after renames: `npm run lint`, `npm run test:unit`, `npm run build`
