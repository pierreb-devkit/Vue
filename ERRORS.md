# AI Error Log

Use this file as a compact memory of recurring AI mistakes.

## Rules

- One error per line
- Keep each line actionable and specific
- Use format: `[YYYY-MM-DD] <scope>: <wrong> -> <right>`
- Add only confirmed/recurrent mistakes and avoid duplicates

## Entries

- [2026-02-19] Vuetify 4 typography: old `text-h1`..`text-h6` classes -> use MD3 classes (`text-display-large`, `text-headline-medium`, `text-body-large`, etc.). Responsive: `text-display-small text-sm-display-medium`
- [2026-02-22] functions: new or modified functions without JSDoc header -> always add JSDoc (description + `@param` for each arg + `@returns` for non-void return values and all async functions)
- [2026-02-22] tests: never patch code to pass a test -> if a test is wrong, fix the test; if logic needs refactoring, refactor it
- [2026-02-23] pr skill: stopping after `gh pr ready` -> always enter the monitor loop (wait CI → 3min grace → read feedback → iterate) until stop condition is met
- [2026-02-23] pr skill: skipping issue creation when none found -> always create a GitHub issue before opening a PR (`gh issue create --web` or via CLI)
- [2026-03-09] Vuetify 4 v-timeline: unconditional `density="compact"` hides `#opposite` slot -> if original was conditional (`:dense="$vuetify.display.xs"`), migrate to `:density="$vuetify.display.xs ? 'compact' : 'default'"` to preserve alternating layout on desktop
- [2026-03-13] cleanup: test helpers/config outside src/ in a standalone folder -> place in src/lib/helpers/ alongside other helpers
- [2026-03-13] docs: duplicate doc files covering the same topic (e.g. MIGRATION.md + MIGRATIONS.md) -> single file, no duplication
- [2026-03-15] auth: adding CASL route guard (action/subject) without checking abilities config -> read abilities file first to confirm the ability exists for target roles; deny access by default if no matching ability (do not downgrade to `requiresAuth`)
- [2026-03-15] pr scope: batching multiple unrelated fixes in one PR -> one fix = one PR to isolate blast radius and reduce iteration loops
- [2026-05-09] update-stack: adding `import './modules/foo/styles/x.css'` to src/main.js downstream -> moved to project view (`src/modules/{project}/views/{project}.view.vue`). Stack-managed entry; --theirs wipes silently. See pierreb-devkit/Vue#4093.
- [2026-06-15] npm audit: treating the 3 advisories (brace-expansion+ip-address moderate, picomatch high) as a runtime exposure -> all are transitive devDependencies (`npm audit --omit=dev` = 0); track upgrades, do not panic-patch the runtime bundle.
- [2026-07-16] auth: swapping a throwing store action (`refreshAbilities()`) for a silently-swallowing one (`token()`, never throws) without preserving the caller's bail-out -> after an `await token()` soft-refresh, check store state (e.g. `!authStore.user`) the way sibling guards do (`app.router.js`'s `isLoggedIn && !user`) before proceeding with UI that assumes the refresh succeeded. See #4447 (verifyEmail.view.vue), follow-up to #4431.
