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
