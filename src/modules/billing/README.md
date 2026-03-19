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
