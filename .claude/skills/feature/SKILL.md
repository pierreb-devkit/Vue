---
name: feature
description: >
  Use this whenever the user asks to "implement", "add", "build", "create",
  or "modify" a feature, page, view, component, or module in this Vue
  project. Three phases: Phase 0 scope analysis (flows + edge cases + UI
  needs + plan validation, STOP for user), Phase 1 implementation (layered
  UI → Store → API, Vue 3 Composition + Vuetify 4, /ui design rules), Phase
  2 Definition-of-Done checklist + /verify + /pull-request. Auto-runs
  /create-module if the target module doesn't exist.
---

# Feature Skill

## Phase 0.0 — Issue Claim (if invoked with `#N`)

**When this section runs:** only if the invocation provides a GitHub issue number, e.g. `/feature #1153`. Skip entirely for `/feature <freeform-spec>` (no issue to claim — proceed directly to Phase 0).

### 1. Read the issue state

```bash
gh issue view <N> --json number,title,state,assignees,comments
```

If the command fails (issue not found, network down, missing scope) → **STOP** and surface the error to the user before proceeding. Do not silently fall through to the claim step.

If `state` is `closed` → **STOP**, ask the user (working on a closed issue is almost always wrong).

### 2. Detect collision

Inspect `assignees[]` and the most recent comment whose body starts with `WIP —` (em dash U+2014, not a hyphen — only the canonical em-dash form is detected; hyphen variants `WIP -` are silently ignored):

| Situation | Action |
|-----------|--------|
| `assignees` contains `@me` (current GitHub user) | Continue silently — resuming own work |
| Most recent `WIP —` comment by `@me` (any age) | Continue silently — resuming own work |
| `assignees` empty AND no `WIP —` comment from anyone | Proceed to claim (step 3) |
| `assignees` contains user ≠ `@me` | **STOP** — surface "Issue #N already assigned to <user>. Take over? (y/N)". Wait for explicit user confirmation. |
| Most recent `WIP —` comment by user ≠ `@me` AND `<24h` old | **STOP** — surface "Issue #N has fresh WIP from <user> (started <ts>). Collision likely. Continue anyway? (y/N)". Wait. |
| Most recent `WIP —` comment by user ≠ `@me` AND `>24h` old | Stale claim — surface "Issue #N has stale WIP from <user> (started <ts>, >24h). Reclaim? (y/N)". Wait. |

"Current GitHub user" = `gh api user --jq .login`. Run inline each time `@me` is compared (the call is fast and read-only).

### 3. Claim

If detection passed (or user confirmed override), run **both** commands:

```bash
gh issue edit <N> --add-assignee @me

gh issue comment <N> --body "WIP — session $(date -u +%Y%m%dT%H%M%SZ)-$(uuidgen | head -c 8), branch <branch-name>, started $(date -u +%Y-%m-%dT%H:%M:%SZ)"
```

Where `<branch-name>` is the branch this `/feature` invocation will use (planned name, even if not yet created). If the branch isn't decided yet, use `branch TBD`. Posting a follow-up comment with the real branch name after `/pull-request` creates it is best-effort manual — the linked PR superseding the WIP comment is what matters in practice.

### 3b. Board status → In progress (best-effort)

After a successful claim, flip the issue's board item — and, if it's a sub-issue, its parent epic — to **In progress**:

```bash
_bs=/Users/pierrebrisorgueil/Documents/Dev/github/pierreb-projects/infra/marketplace/shared/board-status.sh
[ -f "$_bs" ] && bash "$_bs" "$(gh repo view --json nameWithOwner -q .nameWithOwner)#<N>" "In progress" || true
```

Best-effort by design: script missing (machine without the infra checkout), org without a board (comes/montaine), or issue not yet on the board → silent no-op; `/dev:roadmap` in-progress-sync is the safety net. Never set Ready or Done from here.

### 4. Proceed to Phase 0

Continue to scope analysis below.

---

## Phase 0 — Scope Analysis (interactive, before coding)

### 1. Identify target module

- Read `CLAUDE.md` for project conventions and stack patterns.
- Read `ERRORS.md` for known bugs and non-obvious pitfalls to avoid before coding.
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

**Error documentation:**
- [ ] If a non-obvious bug was fixed, document it in `ERRORS.md` (root of repo) with: symptom, root cause, fix

### 7b. Elegance check

For non-trivial changes: pause and ask yourself "is there a simpler or more elegant approach?" If the current implementation feels hacky, refactor before proceeding.

### 8. Run `/verify`

### 9. Run `/pull-request`
