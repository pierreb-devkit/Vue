# Billing Module

Stripe billing UI with quota display.

## Composables

### `useQuota()`

```js
import { useQuota } from './composables/billing.useQuota.js';

const { plan, usage, limits, canDo, usagePercent, refresh } = useQuota();

if (!canDo('documents', 'create')) {
  // Show upgrade prompt
}
```

### `useBilling()`

```js
import { useBilling } from './composables/billing.useBilling.js';

const { currentPlan, isPlanActive, hasPlan } = useBilling();
```

## Components

### `<BillingUsageBarComponent>`

```vue
<BillingUsageBarComponent resource="documents" action="create" label="Documents" />
```

Auto-colored progress bar (green/orange/red). Shows "Unlimited" for uncapped plans.

### `<BillingUpgradePrompt>`

```vue
<!-- Generic -->
<BillingUpgradePrompt requiredPlan="starter" />

<!-- With usage context -->
<BillingUpgradePrompt requiredPlan="starter" resource="documents" action="create" label="Documents" />
```

### `<BillingPlanBadgeComponent>`

```vue
<BillingPlanBadgeComponent :plan="currentPlan" />
```

### `<BillingNavComputeGaugeComponent>`

Sidenav compute-usage indicator (meter mode). A color-coded ring + `X% used`
label; the hover tooltip shows `used / total compute · resets <day>`. The ring
fades/scales in on mount and pulses near exhaustion (≥ 80%) — both motions
respect `prefers-reduced-motion`.

When the server config defines `billing.equivalences`, the tooltip also surfaces
a human-readable remaining-capacity estimate via `<BillingEquivalencesChipsComponent>`.

### `<BillingEquivalencesChipsComponent>` + the `equivalences` contract

Renders capacity chips (`{ kind, count, label }`) color-coded by kind
(`easy` → green, `hard` → amber, `feature` → brand).

The nav gauge derives those chips from `serverConfig.billing.equivalences` — an
**opaque passthrough** from the backend auth config that **downstream projects
define** (the devkit ships only a neutral demo default):

```js
// serverConfig.billing.equivalences  (null / absent / [] → gauge shows raw units only)
[
  { kind: 'easy', unitCost: 200,  label: 'easy operations' },
  { kind: 'hard', unitCost: 2000, label: 'heavy operations' },
]
```

- `unitCost` = compute units consumed per ONE operation of that kind (finite, `> 0`).
- The gauge renders `count = floor(totalRemaining / unitCost)` per entry, where
  `totalRemaining = max(0, (meterQuota + extrasRemaining) − meterUsed)`.
- Only the consumption-scaled kinds `easy` / `hard` are surfaced; entries with a
  non-positive/non-finite `unitCost`, a non-string `label`, or any other kind are
  dropped. The unit-cost framing means **per-period and one-shot grants need no
  special handling** — for a one-shot grant, `totalRemaining` is simply the
  remaining grant.
