# Monitor loop — full procedure

Full body of the autonomous monitor loop referenced from §6 of `SKILL.md`.
Load only when actively running the loop on a PR.

## Setup

```bash
OWNER=$(gh repo view --json owner -q .owner.login)
REPO=$(gh repo view --json name -q .name)
PR=<number>
```

After `gh pr ready`, run this loop yourself — do not wait for the user.

**Ordering invariant:** the PR must be ready (not draft) before this loop
starts — CodeRabbit never reviews a draft PR, so waiting on it while draft is
a guaranteed silent deadlock. Step 0 below is a defensive re-check, not a
substitute for flipping to ready in §5 before entering the loop.

## Loop procedure

```text
consecutive_zero = 0

REPEAT:
  0. Draft guard (belt-and-braces)      → see 6a-0. If still draft with CI green, flip to ready now.
  1. Wait for CI                        → sleep 30 then gh pr checks "$PR" --watch
  2. If CI fails                        → fix, /verify, commit, push, consecutive_zero=0, GOTO 1
  2a. Re-run draft guard                → see 6a-0. CI is confirmed green here (whether it started
                                           green or just turned green in step 1) — re-checking closes
                                           the gap where a pass starting draft+red would otherwise sail
                                           straight through to mergeability/grace/review-wait still draft.
  2b. Check mergeable status            → gh pr view "$PR" --json mergeable --jq .mergeable
                                           if "CONFLICTING" → report to user and STOP
                                           if "UNKNOWN" → sleep 30, retry (up to 3 times), then proceed
  3. Grace period                       → sleep 180 + adaptive check (see 6b)
  4. Re-check pending review checks     → gh pr checks "$PR" — if any still pending, GOTO 3
  5. Read all feedback                  → unresolved threads only (see 6b)
  6. If actionable comments             → fix all, /verify, commit, push, reply, resolve, consecutive_zero=0, GOTO 1
  7. If non-actionable unresolved       → reply all explaining why, resolve all, consecutive_zero=0, GOTO 5
  8. If zero unresolved threads         → consecutive_zero++
                                           if consecutive_zero >= 3 → check branch protection (see 6f), then STOP ✓
                                           else GOTO 3
```

## 6a-0. Draft guard (belt-and-braces)

Run at the top of **every** pass, before waiting on CI or reading threads.
Covers the race where the loop started before the ready-flip landed, or a
rebase/force-push reverted the PR to draft:

```bash
STATE=$(gh pr view "$PR" --json isDraft,statusCheckRollup)
IS_DRAFT=$(echo "$STATE" | jq -r '.isDraft')
# green = rollup non-empty (an empty rollup right after a force-push/rebase must NOT read as green) AND
# every check is SUCCESS/NEUTRAL/SKIPPED (all non-blocking; a bare FAILURE/CANCELLED or still-pending check stays not-green)
CI_GREEN=$(echo "$STATE" | jq -r '[.statusCheckRollup[]? | (.conclusion // .state)] | length > 0 and all(. as $s | ["SUCCESS","NEUTRAL","SKIPPED"] | index($s) != null)')

if [ "$IS_DRAFT" = "true" ] && [ "$CI_GREEN" = "true" ]; then
  if ! gh pr ready "$PR"; then
    sleep 5
    if ! gh pr ready "$PR"; then
      echo "gh pr ready failed twice on PR $PR — stopping to avoid a draft deadlock." >&2
      exit 1
    fi
  fi
fi
```

If `gh pr ready` fails, retry once (5s later); if it still fails, stop and
report to user — never fall through to mergeability/grace/review-wait with
the PR still draft. Continue only once the PR is confirmed non-draft.

If still draft with CI **not** green, do nothing here — fall through to 6a,
fix CI first. Once CI turns green (either at pass start or mid-pass in 6a),
this guard re-runs at step 2a before mergeability/grace/review-wait — never
"next pass."

## 6a. Wait for CI

After any push, wait 30s then watch:

```bash
sleep 30
gh pr checks "$PR" --watch
```

If `no checks reported`, retry up to 5 times (30s apart). If still no checks
after 5 retries, report to user and stop.

If any check fails → fix, `/verify`, commit, push, restart loop. Do not read
review feedback until CI passes.

## 6b. Read all feedback — unresolved threads only

Grace period: `sleep 180` (3 min). Poll for new review threads (see
`monitoring.md`); if count is zero, `sleep 120` (2 more min, 5 min total)
before proceeding.

Read **only unresolved threads** (resolved = ignored). See `monitoring.md`
for exact commands.

```bash
# Optional context only (do not drive action from these):
# gh pr view $PR --json reviews,comments
# gh api repos/$OWNER/$REPO/pulls/$PR/comments --paginate | jq 'map({id, user: .user.login, body})'
# gh api repos/$OWNER/$REPO/issues/$PR/comments --paginate | jq 'map({id, user: .user.login, body})'
# Action source of truth: unresolved threads query in monitoring.md
```

**Actionable** (must fix): change requests, bug reports, missing tests,
security issues, code suggestions.

**Informational** (reply + resolve, no code change): approvals, coverage
reports, style preferences without change request, false positives. PR-level
comments (codecov, approvals) cannot be resolved via thread API — don't count
as unresolved.

## 6b-bis. Classify stack-level vs downstream comments (downstream projects only)

Skip when running directly on the stack repo. Requires `devkit-vue` remote
(set up by `/update-stack`) — if missing, stop and report.

For each actionable comment, check if the file exists in upstream:

```bash
git remote get-url devkit-vue >/dev/null 2>&1 || git remote add devkit-vue git@github.com:<stack-owner>/<stack-repo>.git
git fetch devkit-vue master --quiet 2>/dev/null
git ls-tree --name-only -r devkit-vue/master -- <file-path>
```

- **Stack-level** → create issue on stack repo with review comment details,
  reply with issue link, resolve thread.
- **Downstream** → fix locally (section 6c).

## 6c. Fix all actionable comments from this pass

Fix all actionable comments in one batch: `/verify` → commit → push → reply
with SHA → resolve threads via GraphQL (see `monitoring.md`). One commit per
pass. You MUST reply to every thread before resolving it — never resolve a
thread silently. The reply serves as audit trail.

## 6d. Coverage gaps

Add missing tests — never lower thresholds. Include in the same commit batch.

## 6e. After pushing fixes

Wait 30s before watching CI (regular or force-push). Loop back to 6a. Never
post `@copilot review` — it invokes the coding agent, not the reviewer.

## 6f. Stop condition

CI green AND 3 consecutive passes with zero unresolved threads (~9 min of
grace periods). Then check branch protection:

```bash
gh pr view "$PR" --json reviewDecision,mergeable | jq '{reviewDecision, mergeable}'
```

- `APPROVED` + `MERGEABLE` → STOP ✓
- `REVIEW_REQUIRED` → report to user, stop
- `CHANGES_REQUESTED` → report to user, stop
- `CONFLICTING` → report to user, stop (also caught early by step 2b)
- `BLOCKED` → report details to user

Safety limit: 10 iterations max — report to user if still unresolved.
