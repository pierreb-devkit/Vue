<!--
  BillingExtrasLedgerComponent
  ==============================
  Paginated table of extras credit ledger entries (admin / debug surface).
  Delegates pagination to the parent via `update:page` emit so the parent
  can call `fetchExtrasLedger({ page, limit })` as needed.

  USAGE:
  <billingExtrasLedgerComponent
    :entries="ledger.entries"
    :total="ledger.total"
    :page="ledger.page"
    :limit="ledger.limit"
    @update:page="onPageChange"
  />

  PROPS:
  - entries (Array, required)   : ledger entry objects from store
  - total   (Number, required)  : total entry count (for pagination)
  - page    (Number, default 1) : current page (1-based)
  - limit   (Number, default 20): rows per page

  EVENTS:
  - update:page (Number) : new page number requested by the user
-->
<template>
  <div class="billing-extras-ledger">
    <!-- Empty state -->
    <div
      v-if="entries.length === 0"
      class="text-caption text-medium-emphasis text-center py-6"
    >
      No ledger entries yet
    </div>

    <template v-else>
      <v-data-table
        :headers="headers"
        :items="entries"
        :items-length="total"
        :items-per-page="limit"
        :page="page"
        hide-default-footer
        density="compact"
        class="billing-extras-ledger__table"
      >
        <!-- at column -->
        <template #[`item.at`]="{ item }">
          <span class="text-caption">{{ formatDate(item.at) }}</span>
        </template>

        <!-- kind column -->
        <template #[`item.kind`]="{ item }">
          <v-chip
            :color="kindColor(item.kind)"
            variant="tonal"
            size="small"
            density="compact"
          >
            {{ item.kind }}
          </v-chip>
        </template>

        <!-- amount column -->
        <template #[`item.amount`]="{ item }">
          <span
            class="font-weight-medium"
            :style="{ fontFamily: 'monospace', color: item.amount >= 0 ? 'rgb(var(--v-theme-success))' : 'rgb(var(--v-theme-error))' }"
          >
            {{ item.amount >= 0 ? '+' : '' }}{{ item.amount }}
          </span>
        </template>

        <!-- refId / historyId column — truncated with native title tooltip -->
        <template #[`item.refId`]="{ item }">
          <span
            class="text-caption text-truncate"
            style="max-width: 100px; display: inline-block"
            :title="item.refId || item.historyId || '—'"
          >
            {{ truncate(item.refId || item.historyId) }}
          </span>
        </template>

        <!-- stripeSessionId column — truncated with native title tooltip -->
        <template #[`item.stripeSessionId`]="{ item }">
          <span
            class="text-caption text-truncate"
            style="max-width: 100px; display: inline-block"
            :title="item.stripeSessionId || '—'"
          >
            {{ truncate(item.stripeSessionId) }}
          </span>
        </template>
      </v-data-table>

      <!-- Pagination -->
      <div v-if="pageCount > 1" class="d-flex justify-center mt-2">
        <v-pagination
          :model-value="page"
          :length="pageCount"
          density="compact"
          @update:model-value="$emit('update:page', $event)"
        />
      </div>
    </template>
  </div>
</template>

<script>
/** Kind → Vuetify color token mapping. */
const KIND_COLORS = {
  topup: 'success',
  debit: 'warning',
  refund: 'info',
  expiration: 'default',
  adjustment: 'primary',
};

/**
 * Component definition.
 */
export default {
  name: 'BillingExtrasLedgerComponent',

  props: {
    /**
     * @desc Array of ledger entry objects.
     * Each entry: { at, kind, amount, refId?, historyId?, stripeSessionId? }
     */
    entries: {
      type: Array,
      required: true,
    },
    /**
     * @desc Total number of entries across all pages (used to compute pagination).
     */
    total: {
      type: Number,
      required: true,
    },
    /**
     * @desc Current page (1-based).
     */
    page: {
      type: Number,
      default: 1,
    },
    /**
     * @desc Rows per page.
     */
    limit: {
      type: Number,
      default: 20,
    },
  },

  emits: ['update:page'],

  data() {
    return {
      headers: [
        { title: 'Date', key: 'at', sortable: false },
        { title: 'Kind', key: 'kind', sortable: false },
        { title: 'Amount', key: 'amount', sortable: false, align: 'end' },
        { title: 'Ref / History', key: 'refId', sortable: false },
        { title: 'Stripe session', key: 'stripeSessionId', sortable: false },
      ],
    };
  },

  computed: {
    /**
     * @desc Total number of pages.
     * @returns {number}
     */
    pageCount() {
      if (this.limit <= 0) return 1;
      return Math.ceil(this.total / this.limit);
    },
  },

  methods: {
    /**
     * @desc Format an ISO date string to a human-readable local date+time.
     * @param {string} value - ISO 8601 date string
     * @returns {string}
     */
    formatDate(value) {
      if (!value) return '—';
      try {
        return new Date(value).toLocaleString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      } catch {
        return value;
      }
    },

    /**
     * @desc Resolve Vuetify color token for a given ledger entry kind.
     * @param {string} kind - Entry kind (topup, debit, refund, expiration, adjustment)
     * @returns {string} Vuetify color token
     */
    kindColor(kind) {
      return KIND_COLORS[kind] ?? 'default';
    },

    /**
     * @desc Truncate a string to 12 characters with ellipsis.
     * @param {string|null|undefined} value
     * @returns {string}
     */
    truncate(value) {
      if (!value) return '—';
      return value.length > 12 ? `${value.slice(0, 12)}…` : value;
    },
  },
};
</script>
