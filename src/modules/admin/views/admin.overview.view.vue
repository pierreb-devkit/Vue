<template>
  <v-container fluid>
    <v-row class="pa-2 mt-0">
      <!-- Headline figures: one card split by dividers -->
      <v-col cols="12">
        <v-card color="surface" :flat="config.vuetify.theme.flat" :class="config.vuetify.theme.rounded">
          <v-progress-linear :active="loading" indeterminate color="primary"></v-progress-linear>
          <div class="d-flex flex-column flex-sm-row">
            <template v-for="(kpi, i) in kpis" :key="kpi.key">
              <v-divider v-if="i > 0" :vertical="$vuetify.display.smAndUp"></v-divider>
              <div class="flex-1-1-0 pa-6" :data-test="`kpi-${kpi.key}`">
                <div class="text-body-medium text-medium-emphasis">{{ kpi.label }}</div>
                <div class="text-headline-medium admin-overview__num mt-1">
                  <span v-if="kpi.value === null" class="text-medium-emphasis">—</span>
                  <template v-else>{{ formatNumber(kpi.value) }}</template>
                </div>
                <div class="text-body-small text-medium-emphasis mt-1">{{ kpi.sub }}</div>
              </div>
            </template>
          </div>
        </v-card>
      </v-col>

      <!-- Weekly series -->
      <v-col v-for="series in weeklySeries" :key="series.key" cols="12" md="6">
        <v-card color="surface" height="100%" :flat="config.vuetify.theme.flat" :class="config.vuetify.theme.rounded">
          <v-card-title class="d-flex align-center pt-5 px-6">
            <span class="text-title-medium">{{ series.title }}</span>
            <v-spacer></v-spacer>
            <v-btn variant="text" size="small" class="text-none" :to="series.to">View all</v-btn>
          </v-card-title>
          <v-card-subtitle class="px-6 text-body-small">Last 12 weeks · {{ series.note }}</v-card-subtitle>
          <v-card-text class="px-6 pb-6 pt-4">
            <div v-if="series.error" class="d-flex align-center ga-2 text-body-medium">
              <v-icon icon="fa-solid fa-circle-exclamation" color="error" size="small"></v-icon>
              <span>Couldn't load {{ series.noun }}.</span>
              <v-btn variant="text" size="small" class="text-none" @click="load">Retry</v-btn>
            </div>
            <AdminWeeklyBarsComponent v-else-if="series.weeks" :weeks="series.weeks" :label="series.title" />
            <div v-else class="admin-overview__placeholder"></div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Subscriptions (billing on only) -->
      <template v-if="billingActive">
        <v-col v-for="split in subscriptionSplits" :key="split.key" cols="12" md="6">
          <v-card color="surface" height="100%" :flat="config.vuetify.theme.flat" :class="config.vuetify.theme.rounded">
            <v-card-title class="pt-5 px-6"><span class="text-title-medium">{{ split.title }}</span></v-card-title>
            <v-card-subtitle class="px-6 text-body-small">Organizations with a subscription record</v-card-subtitle>
            <v-card-text class="px-6 pb-6 pt-4">
              <div v-if="statsErrors.includes('billing')" class="d-flex align-center ga-2 text-body-medium">
                <v-icon icon="fa-solid fa-circle-exclamation" color="error" size="small"></v-icon>
                <span>Couldn't load subscriptions.</span>
                <v-btn variant="text" size="small" class="text-none" @click="load">Retry</v-btn>
              </div>
              <div v-else-if="split.rows && !split.rows.length" class="text-body-medium text-medium-emphasis">
                No subscriptions yet.
              </div>
              <div v-else-if="split.rows">
                <div v-for="row in split.rows" :key="row.key" class="mb-4" :data-test="`${split.key}-${row.key}`">
                  <div class="d-flex justify-space-between text-body-medium mb-1">
                    <span class="text-capitalize">{{ row.label }}</span>
                    <span class="admin-overview__num">
                      {{ formatNumber(row.count) }}
                      <span class="text-medium-emphasis text-body-small ml-1">{{ row.share }}%</span>
                    </span>
                  </div>
                  <v-progress-linear
                    :model-value="row.share"
                    :color="split.key === 'plan' ? 'primary' : row.color"
                    bg-color="surface-variant"
                    height="6"
                    rounded
                    :aria-label="`${row.label}: ${row.count}`"
                  ></v-progress-linear>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </template>
    </v-row>
  </v-container>
</template>

<script>
/**
 * Module dependencies.
 */
import { useAdminStore } from '../stores/admin.store';
import AdminWeeklyBarsComponent from '../components/admin.weeklyBars.component.vue';

/** Stripe statuses that need attention get the status colour; the rest stay neutral. */
const STATUS_COLORS = Object.freeze({
  past_due: 'warning',
  unpaid: 'error',
  incomplete: 'warning',
  incomplete_expired: 'error',
  canceled: 'grey',
});

/**
 * @desc Rows for a count map, largest first, with a share of the total.
 * @param {Object<string, number>} map - key → count
 * @param {number} total - sum of the counts
 * @returns {Array<{key: string, label: string, count: number, share: number, color: string}>} rows
 */
const toRows = (map, total) =>
  Object.entries(map || {})
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => ({
      key,
      label: key.replace(/_/g, ' '),
      count,
      share: total > 0 ? Math.round((count / total) * 100) : 0,
      color: STATUS_COLORS[key] || 'primary',
    }));

/**
 * Component definition.
 *
 * Overview tab of the admin section — headline figures and 12-week trends
 * for accounts and organizations, plus the subscription split by plan and
 * status when the billing module is on. Data comes from the per-module
 * admin stats routes via `useAdminStore().getStats()`.
 */
export default {
  name: 'AdminOverview',
  components: { AdminWeeklyBarsComponent },
  data() {
    return {
      loading: false,
    };
  },
  computed: {
    /** @returns {boolean} billing module switched on in this app */
    billingActive() {
      return this.config?.modules?.billing?.activated !== false;
    },
    stats() {
      return useAdminStore().stats;
    },
    statsErrors() {
      return useAdminStore().statsErrors;
    },
    /** @returns {Array<object>} headline figures */
    kpis() {
      const { users, organizations, billing } = this.stats;
      const thisWeek = (s) => (s?.weeks?.length ? s.weeks[s.weeks.length - 1].count : null);
      const list = [
        {
          key: 'users',
          label: 'Accounts',
          value: users ? users.total : null,
          sub: thisWeek(users) === null ? ' ' : `${this.formatNumber(thisWeek(users))} new this week`,
        },
        {
          key: 'organizations',
          label: 'Organizations',
          value: organizations ? organizations.total : null,
          sub: thisWeek(organizations) === null ? ' ' : `${this.formatNumber(thisWeek(organizations))} new this week`,
        },
      ];
      if (this.billingActive) {
        const paid = billing ? Object.entries(billing.byPlan || {}).filter(([plan]) => plan !== 'free').reduce((s, [, c]) => s + c, 0) : null;
        list.push({
          key: 'subscriptions',
          label: 'Paid plans',
          value: paid,
          sub: billing ? `of ${this.formatNumber(billing.total)} subscriptions` : ' ',
        });
      }
      return list;
    },
    /** @returns {Array<object>} the two weekly charts */
    weeklySeries() {
      return [
        {
          key: 'users',
          title: 'New accounts',
          noun: 'accounts',
          note: 'deleted accounts are not counted',
          to: '/admin/users',
          weeks: this.stats.users?.weeks || null,
          error: this.statsErrors.includes('users'),
        },
        {
          key: 'organizations',
          title: 'New organizations',
          noun: 'organizations',
          note: 'deleted organizations are not counted',
          to: '/admin/organizations',
          weeks: this.stats.organizations?.weeks || null,
          error: this.statsErrors.includes('organizations'),
        },
      ];
    },
    /** @returns {Array<object>} subscription splits (by plan, by status) */
    subscriptionSplits() {
      const billing = this.stats.billing;
      return [
        { key: 'plan', title: 'Subscriptions by plan', rows: billing ? toRows(billing.byPlan, billing.total) : null },
        { key: 'status', title: 'Subscriptions by status', rows: billing ? toRows(billing.byStatus, billing.total) : null },
      ];
    },
  },
  mounted() {
    this.load();
  },
  methods: {
    /**
     * @desc Fetch every stats series (billing only when the module is on).
     * @returns {Promise<void>}
     */
    async load() {
      this.loading = true;
      try {
        await useAdminStore().getStats({ billing: this.billingActive });
      } finally {
        this.loading = false;
      }
    },
    /**
     * @desc Format a count with thousands separators.
     * @param {number} n - count
     * @returns {string} formatted count
     */
    formatNumber(n) {
      return Number(n || 0).toLocaleString('en-US');
    },
  },
};
</script>

<style scoped>
.admin-overview__num {
  font-variant-numeric: tabular-nums;
}
.admin-overview__placeholder {
  height: 182px;
}
</style>
