# Migrations

Breaking changes and upgrade notes for downstream projects.

---

## Organizations & CASL (2026-03-13)

This guide walks downstream Vue projects through migrating from the legacy role-based routing (`meta.roles` / `localStorage.UserRoles`) to the new CASL ability system and the optional organizations module.

---

### Breaking Changes

| Area | What changed |
|------|-------------|
| Route meta | `meta.roles` removed from all routes, replaced by `meta.action` + `meta.subject` |
| Dependencies | New: `@casl/ability` (v6), `@casl/vue` (v2) |
| Router guard | `beforeEach` in `app.router.js` rewritten to use `ability.can()` |
| Navigation | `refreshNav()` in `core.store.js` now filters by CASL abilities instead of roles |
| localStorage | `UserRoles` is still written (backward compat) but **no longer used for routing** |
| Auth store | Imports `updateAbilities` from `src/lib/helpers/ability.js`; calls it on signin, token refresh, and signout |
| New module | `src/modules/organizations/` (store, router, views, components) |
| Signup flow | Optional organization step after registration when `serverConfig.organizations.enabled === true` |

---

### Prerequisites

1. **Update the backend first.** The Node stack must return `abilities` in its signin / token responses and expose the `/organizations` API. See the Node migration guide.
2. Install the new dependencies:

```bash
npm install @casl/ability @casl/vue
```

---

### Step-by-step Migration

#### Step 1: Install CASL

```bash
npm install @casl/ability @casl/vue
```

Verify `package.json` contains:

```json
"@casl/ability": "^6.8.0",
"@casl/vue": "^2.2.6"
```

#### Step 2: Create the ability helper

Create `src/lib/helpers/ability.js`:

```js
import { createMongoAbility } from '@casl/ability';
import { reactive } from 'vue';

export const ability = reactive(createMongoAbility([]));

export const updateAbilities = (rules) => {
  ability.update(rules);
};

export default { ability, updateAbilities };
```

Key points:
- `createMongoAbility([])` starts with an empty rule set (deny-all by default).
- Wrapping with `reactive()` keeps Vue templates reactive when rules change.
- `updateAbilities()` replaces all rules atomically.

#### Step 3: Register the CASL plugin in `main.js`

Add the following to `src/main.js`:

```js
import { abilitiesPlugin } from '@casl/vue';
import { ability } from './lib/helpers/ability';

// In the app.use() chain:
app.use(abilitiesPlugin, ability);
```

This makes `can()` and `cannot()` available in all component templates via `@casl/vue`.

#### Step 4: Update the auth store

In `src/modules/auth/stores/auth.store.js`:

1. Import the helper:

```js
import { updateAbilities } from '../../../lib/helpers/ability';
```

2. In the `signin` action, after setting user data:

```js
if (res.data.abilities) updateAbilities(res.data.abilities);
```

3. In the `token` action, same pattern:

```js
if (res.data.abilities) updateAbilities(res.data.abilities);
```

4. In the `signout` action, clear abilities:

```js
updateAbilities([]);
```

The backend sends abilities as an array of CASL rule objects, e.g.:

```json
[
  { "action": "read", "subject": "Task" },
  { "action": "manage", "subject": "User" }
]
```

#### Step 5: Migrate route definitions

For every module router file, replace `meta.roles` with `meta.action` + `meta.subject`.

##### Complete route mapping

| Module | Route | Old `meta` | New `meta` |
|--------|-------|-----------|-----------|
| **home** | `/` | _(none)_ | _(none)_ -- public, no change |
| **home** | `/changelogs`, `/team`, `/pages/:name` | _(none)_ | _(none)_ -- public, no change |
| **auth** | `/signin`, `/signup`, `/forgot`, `/reset`, `/token` | `display: false` | `display: false` -- public, no change |
| **tasks** | `/tasks` (list) | `roles: ['user']` | _(no action/subject)_ -- public list page |
| **tasks** | `/task` (create) | `roles: ['user']` | `action: 'read', subject: 'Task'` |
| **tasks** | `/tasks/:id` (detail) | `roles: ['user']` | `action: 'read', subject: 'Task'` |
| **users** | `/users` (list) | `roles: ['admin']` | `action: 'manage', subject: 'User'` |
| **users** | `/users/:id` (detail) | `roles: ['admin']` | `action: 'manage', subject: 'User'` |
| **secure** | `/secure` | `roles: ['user']` | `action: 'read', subject: 'Secure'` |
| **organizations** | `/organizations` | _(new)_ | `action: 'read', subject: 'Organization'` |
| **organizations** | `/organizations/create` | _(new)_ | `action: 'create', subject: 'Organization'` |
| **organizations** | `/organizations/:organizationId` | _(new)_ | `action: 'read', subject: 'Organization'` |

Example -- `tasks.router.js`:

```js
// Before
{
  path: '/task',
  name: 'task create',
  component: task,
  meta: {
    display: false,
    roles: ['user'],
  },
},

// After
{
  path: '/task',
  name: 'task create',
  component: task,
  meta: {
    display: false,
    action: 'read', subject: 'Task',
  },
},
```

#### Step 6: Update the router guard

Replace the `beforeEach` guard in `src/modules/app/app.router.js`:

```js
router.beforeEach(async (to) => {
  // Page title
  const pageTitle = to.meta.title || to.name;
  document.title = pageTitle ? `${pageTitle} - ${config.app.title}` : config.app.title;

  // Ability-based guard
  if (to.matched.some((record) => record.meta.action)) {
    const authStore = useAuthStore();
    if (authStore.isLoggedIn) {
      const { ability } = await import('../../lib/helpers/ability.js');
      if (ability && ability.rules && ability.rules.length > 0) {
        if (ability.can(to.meta.action, to.meta.subject)) return true;
        return '/'; // forbidden
      }
      // Fallback: no abilities loaded yet (backend not updated) -- allow if logged in
      return true;
    }
    return '/signin';
  }
});
```

The fallback to `isLoggedIn` provides cross-stack safety: if the backend has not been updated yet and does not send abilities, authenticated users can still navigate.

#### Step 7: Update navigation filtering

Replace `refreshNav()` in `src/modules/core/stores/core.store.js`:

```js
import { ability } from '../../../lib/helpers/ability';

// Inside the store actions:
refreshNav(isLoggedIn) {
  const hasAbilities = ability && ability.rules && ability.rules.length > 0;

  const nav = orderBy(
    pickBy(this.routes, (i) => {
      if (i.meta.display !== false) {
        if (!('action' in i.meta)) return i; // no guard, always show
        if (isLoggedIn) {
          if (hasAbilities) {
            if (ability.can(i.meta.action, i.meta.subject)) return i;
          } else {
            return i; // fallback: show if logged in
          }
        }
      }
      return null;
    }),
    ['meta.action'],
    ['desc'],
  );

  this.nav = nav;
},
```

#### Step 8: Template migration

Update templates that previously relied on `isLoggedIn` or role checks for conditional rendering.

```vue
<!-- Before -->
<v-btn v-if="isLoggedIn">Delete</v-btn>

<!-- After (using @casl/vue helpers in <script setup> or Options API) -->
<v-btn v-if="can('delete', subject('Task', task))">Delete</v-btn>
```

In Options API components, `can()` is available automatically through the `@casl/vue` plugin registered in `main.js`. You can use it directly in templates:

```vue
<template>
  <v-btn v-if="$can('delete', 'Task')">Delete Task</v-btn>
  <v-btn v-if="$can('manage', 'User')">Manage Users</v-btn>
</template>
```

For instance-level checks (e.g. "can this user update *this specific* task?"), use `subject()`:

```vue
<script>
import { subject } from '@casl/ability';
export default {
  methods: {
    canUpdate(task) {
      return this.$can('update', subject('Task', task));
    },
  },
};
</script>
```

#### Step 9: Add the organizations module

Copy the entire `src/modules/organizations/` directory from the stack. The module includes:

```
src/modules/organizations/
  router/organizations.router.js       # Routes: /organizations, /organizations/create, /organizations/:id
  stores/organizations.store.js        # Pinia store: CRUD + switchOrganization + members
  views/organizations.view.vue         # List view
  views/organizations.create.view.vue  # Create view
  views/organization.view.vue          # Detail/edit view (with delete confirmation)
  components/organizations.switcher.component.vue  # Org switcher dropdown (for nav bar)
  components/organizations.members.component.vue   # Members list + invite
  components/organizations.invite.component.vue    # Invite form
  tests/organizations.store.spec.js    # Store unit tests
```

**Register the module router** in `app.router.js`:

```js
import organizations from '../organizations/router/organizations.router';

const routes = [].concat(home, auth, users, secure, tasks, organizations);
```

**Add the organization switcher** to your navigation/header component:

```vue
<script>
import OrganizationsSwitcherComponent from '../../organizations/components/organizations.switcher.component.vue';
</script>

<template>
  <OrganizationsSwitcherComponent />
</template>
```

The switcher auto-hides when organizations are disabled or the user belongs to only one organization. When the user switches organizations, the store calls `POST /organizations/:id/switch`, receives a new JWT with updated abilities, and calls `updateAbilities()`.

#### Step 10: Update the signup flow

The signup view (`src/modules/auth/views/auth.signup.view.vue`) now supports a multi-step flow:

1. **Form step** -- standard email/password registration.
2. **Organization welcome** -- shown when the backend auto-created or auto-joined an organization (the response contains `result.organization`).
3. **Organization setup** -- shown when `result.organizationSetupRequired === true`; renders the `AuthOrganizationSetupComponent` which lets the user name their new org.

Add the `AuthOrganizationSetupComponent`:

```
src/modules/auth/components/auth.organizationSetup.component.vue
```

In the signup `validate()` method, handle the organization flow:

```js
const result = await authStore.signup({ email, password, firstName, lastName });

if (this.serverConfig?.organizations?.enabled) {
  if (result.organization) {
    // auto-created or auto-joined
    this.signupStep = 'organizationWelcome';
  } else if (result.organizationSetupRequired) {
    // manual creation needed
    this.signupStep = 'organizationSetup';
  } else {
    this.$router.push(this.config.sign.route);
  }
} else {
  this.$router.push(this.config.sign.route);
}
```

#### Step 11: Axios 403 handling (optional)

If your backend returns 403 when abilities are stale, you can add an interceptor in `src/lib/services/axios.js` to re-fetch abilities:

```js
let isRefreshingAbilities = false;

instance.interceptors.response.use(
  (response) => response,
  async (err) => {
    if (err?.response?.status === 403 && !isRefreshingAbilities) {
      isRefreshingAbilities = true;
      try {
        const authStore = useAuthStore();
        await authStore.token(); // re-fetches user + abilities
      } finally {
        isRefreshingAbilities = false;
      }
    }
    throw err;
  },
);
```

The `isRefreshingAbilities` flag prevents infinite loops when the token endpoint itself returns 403.

---

### Conditional Organizations (B2C Mode)

When `serverConfig.organizations.enabled === false` (or the backend does not expose organizations at all):

| Behavior | Effect |
|----------|--------|
| Organization routes | Still registered but guarded by `action: 'read', subject: 'Organization'` -- the backend will not grant this ability, so routes are inaccessible |
| Org switcher | Auto-hidden (`isVisible` returns false when no orgs or feature disabled) |
| Signup | No organization step -- proceeds directly to the app |
| Abilities | Still function normally -- the backend sends ability rules scoped to the user without an org context |
| Navigation | Org link will not appear because `ability.can('read', 'Organization')` returns false |

No code changes are needed to disable organizations. It is entirely controlled by the backend configuration.

---

### Testing Checklist

- [ ] All routes guarded by `ability.can()` -- verify in `app.router.js` `beforeEach`
- [ ] Fallback works when backend does not send abilities (logged-in users can still navigate)
- [ ] Public routes (`/`, `/signin`, `/signup`, `/forgot`, `/changelogs`, etc.) accessible without auth
- [ ] Navigation updates on login/logout (`refreshNav` called with correct `isLoggedIn`)
- [ ] 403 triggers ability refresh (if interceptor added) without infinite loop
- [ ] Org switcher visible only when enabled and user has multiple orgs
- [ ] Org switcher calls `switchOrganization` and updates abilities
- [ ] Signup org step shown only when `serverConfig.organizations.enabled === true`
- [ ] `AuthOrganizationSetupComponent` emits `created` and transitions to welcome step
- [ ] `updateAbilities([])` clears all permissions on signout
- [ ] Admin-only routes (`/users`) require `manage` + `User` ability

---

## Header "float" scroll mode (2026-03-08)

New header scroll mode: the navbar shrinks to a floating pill on scroll.

To activate, set in `src/modules/app/config/app.development.config.js` → `vuetify.theme.header`:

```js
scrollBehavior: 'float',
colorMode: null,
```

The development defaults now ship with `'float'` enabled. To restore the previous behavior, set:

```js
scrollBehavior: 'hide',
colorMode: 'light',
opacity: undefined,
```

---

## Config file naming convention (2026-03-13)

All config files now follow the `module.env.kind.js` naming convention consistently.

### What changed

- **Global defaults renamed**: `config.{env}.js` → `{env}.config.js` (e.g. `development.config.js`)
- **Module defaults renamed**: `config.{module}.js` → `{module}.development.config.js` (e.g. `auth.development.config.js`)
- **Generator updated**: `scripts/generateConfig.js` matches `*.development.config.js` for module defaults
- **Template renamed**: `src/config/defaults/myproject.config.js`

### Naming convention

| File type | Pattern | Example |
|-----------|---------|---------|
| Global default | `{env}.config.js` | `development.config.js` |
| Global override | `{env}.config.js` | `production.config.js` |
| Module default | `{module}.development.config.js` | `app.development.config.js` |
| Module env override | `{module}.{env}.config.js` | `app.test.config.js` |
| Downstream project | `{project}.config.js` | `myproject.config.js` |

### Placement strategy: semantic ownership

Config belongs to the module that **semantically owns** the data, even if other modules read it. Global keeps only pure infrastructure (app metadata, api, port, cookie, analytics). This enables autonomous, pluggable modules.

| Key | Owner | Why |
|-----|-------|-----|
| `vuetify`, `header`, `footer`, `pages` | `app` | App module owns the UI framework and layout |
| `sign`, `oAuth` | `auth` | Auth defines how users authenticate |
| `whitelists` | `users` | Users defines its own field visibility |
| `organizations` | `organizations` | Orgs defines its own settings |
| home sections | `home` | Home defines its own page content |
| `app`, `port`, `api`, `cookie`, `analytics` | global | Pure infrastructure, no module owns them |

### File layout

```text
src/config/defaults/
  development.config.js          ← infra only (app, port, api, cookie, analytics)
  production.config.js           ← production overrides (standalone)
  test.config.js                 ← test overrides (standalone)
  myproject.config.js            ← template for downstream projects

src/modules/app/config/
  app.development.config.js      ← vuetify, header, footer, pages

src/modules/auth/config/
  auth.development.config.js     ← sign, oAuth

src/modules/users/config/
  users.development.config.js    ← whitelists

src/modules/home/config/
  home.development.config.js     ← home sections (hero, features, gallery, etc.)

src/modules/organizations/config/
  organizations.development.config.js  ← organizations settings
```

### Merge order (priority ascending)

1. Module defaults — `src/modules/*/config/*.development.config.js`
2. Global defaults — `src/config/defaults/development.config.js`
3. Global env overrides — `src/config/defaults/${NODE_ENV}.config.js` (if NODE_ENV ≠ development)
4. `DEVKIT_VUE_*` environment variables

### Custom environments

Create `NODE_ENV=staging` by adding:
- `src/config/defaults/staging.config.js` (global overrides)

### Downstream project config files

Files must be named `{projectname}.config.js`. A template is provided at `src/config/defaults/myproject.config.js`.

### Steps for downstream projects

1. Rename global config files: `config.{env}.js` → `{env}.config.js`
2. Rename module config files: `config.{module}.js` → `{module}.development.config.js`
3. Rename project config files: `config.{project}.js` → `{project}.config.js`
4. Run `npm run dev` to verify the generated `src/config/index.js` is correct.

---

## Configuration split by module (2026-03-07)

The monolithic `src/config/defaults/development.js` has been split into per-module config files.

See "Config file naming convention (2026-03-13)" above for the current naming standard.

Additional changes from this migration:
- **Typo fixes**: `sucessColor` → `successColor` (app config), `Ressources` → `Resources` (home config) — a backward-compatible fallback is provided in `axios.js`
- **Env var prefix**: `WAOS_VUE_*` → `DEVKIT_VUE_*`
8. Run `npm run lint && npm run test:unit && npm run build` to confirm everything works.
