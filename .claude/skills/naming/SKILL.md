---
name: naming
description: Check or apply file and folder naming conventions for this Vue project. Use when creating new files or folders, renaming existing ones, auditing a module for naming consistency, or any time the correct name/path for a file is unclear.
---

# Naming Skill

Audit or apply the project's file and folder naming conventions.

## Conventions

### Folders

| Location           | Case                | Example                                                 |
| ------------------ | ------------------- | ------------------------------------------------------- |
| Top-level src dirs | kebab-case          | `src/lib/`, `src/modules/`                              |
| Module dirs        | kebab-case          | `modules/home/`, `modules/user-settings/`               |
| Module sub-dirs    | fixed names         | `components/`, `views/`, `stores/`, `router/`, `tests/` |
| Component utils    | `components/utils/` | `components/utils/`                                     |

### Files

| Type      | Pattern                         | Example                   |
| --------- | ------------------------------- | ------------------------- |
| Component | `{module}.{name}.component.vue` | `home.hero.component.vue` |
| View      | `{module}.{name}.view.vue`      | `auth.signin.view.vue`    |
| Store     | `{module}.store.js`             | `tasks.store.js`          |
| Router    | `{module}.router.js`            | `users.router.js`         |
| Test      | `{target}.spec.js`              | `home.store.spec.js`      |
| Service   | `{name}.js`                     | `axios.js`                |
| Helper    | `{name}.js`                     | `tools.js`                |
| Plugin    | `{name}.js`                     | `vuetify.js`              |
| Config    | `{name}.js` or `index.js`       | `development.js`          |

### Case conventions in code

| Context             | Convention         | Example                             |
| ------------------- | ------------------ | ----------------------------------- |
| Variable / function | lowerCamelCase     | `useHomeStore`, `paginationRequest` |
| Component name (JS) | PascalCase         | `HomeHeroComponent`                 |
| Store export        | `use{Module}Store` | `useTasksStore`                     |
| Constant / env key  | UPPER_SNAKE_CASE   | `MY_MODULE_KEY`                     |

---

## Rules

1. **Dot-notation prefix**: always prefix with the module name separated by dots
   - `home.hero.component.vue` not `hero.component.vue`
   - `tasks.store.js` not `store.js`

2. **Semantic suffix**: always add the type suffix
   - `.component.vue` for reusable components
   - `.view.vue` for page-level views
   - `.store.js` for Pinia stores
   - `.router.js` for route definitions
   - `.spec.js` for tests

3. **Singular vs plural**: follow the module's data semantics
   - List of items → plural: `tasks.view.vue`, `users.view.vue`
   - Single item → singular: `task.view.vue`, `user.view.vue`

4. **Utility sub-components**: place in `components/utils/` and keep the module prefix
   - `components/utils/home.blur.background.component.vue`

5. **Shared code**: files in `src/lib/` use simple kebab-case, no module prefix
   - `src/lib/helpers/tools.js`, `src/lib/plugins/vuetify.js`

---

## Steps

### When creating a new file

1. Identify the module it belongs to (e.g., `users`)
2. Identify the file type (component, view, store, router, test, helper, plugin)
3. Derive the name:
   - module prefix (kebab-case) + dot + semantic name (kebab-case) + dot + type suffix
   - Example: module=`users`, name=`profile`, type=component → `users.profile.component.vue`
4. Place it in the correct sub-directory:
   - `.vue` components → `src/modules/{module}/components/`
   - `.vue` views → `src/modules/{module}/views/`
   - stores → `src/modules/{module}/stores/`
   - routers → `src/modules/{module}/router/`
   - tests → `src/modules/{module}/tests/`
5. Confirm the name follows the table above before writing the file

### When auditing a module

1. List all files in `src/modules/{module}/`
2. Check each file against the conventions table
3. Report any violations with the expected name
4. Apply renames if requested (use `/feature` or direct edits)
5. Run `/verify` after renaming

---

## Examples

| Situation                | Correct name                               | Wrong name                           |
| ------------------------ | ------------------------------------------ | ------------------------------------ |
| Hero component in `home` | `home.hero.component.vue`                  | `HeroComponent.vue`, `hero.vue`      |
| Sign-in page in `auth`   | `auth.signin.view.vue`                     | `SignIn.vue`, `signin.vue`           |
| Pinia store in `tasks`   | `tasks.store.js`                           | `tasksStore.js`, `store.js`          |
| Router in `users`        | `users.router.js`                          | `router.js`, `usersRouter.js`        |
| Test for home store      | `home.store.spec.js`                       | `homeStore.test.js`, `store.spec.js` |
| Utility helper           | `src/lib/helpers/tools.js`                 | `src/lib/helpers/tools.helper.js`    |
| Utility sub-component    | `components/utils/home.tabs.component.vue` | `components/utils/Tabs.vue`          |
