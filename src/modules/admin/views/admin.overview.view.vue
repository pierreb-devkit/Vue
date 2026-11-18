<template>
  <v-container fluid>
    <v-progress-linear :active="loading" indeterminate color="primary" class="mb-n1"></v-progress-linear>

    <v-row class="pa-2 mt-0">
      <!-- Main KPIs -->
      <v-col v-for="kpi in kpis" :key="kpi.key" cols="6" :lg="12 / kpis.length">
        <v-card color="surface" height="100%" :flat="config.vuetify.theme.flat" :class="config.vuetify.theme.rounded" class="pa-5" :data-test="`kpi-${kpi.key}`">
          <h2 class="text-body-medium text-medium-emphasis">{{ kpi.label }}</h2>
          <div class="text-headline-medium admin-overview__num mt-2" data-test="value">
            <template v-if="kpi.value !== null">{{ formatNumber(kpi.value) }}</template>
            <span v-else class="text-medium-emphasis">—</span>
          </div>
          <div class="text-body-small text-medium-emphasis mt-1 admin-overview__line" data-test="caption">
            <template v-if="kpi.value !== null">{{ kpi.caption }}</template>
          </div>
          <div class="text-body-small mt-3 d-flex align-center ga-1 admin-overview__line" :class="kpi.trend ? kpi.trend.class : ''" data-test="trend">
            <template v-if="kpi.trend">
              <v-icon v-if="kpi.trend.icon" :icon="kpi.trend.icon" size="x-small"></v-icon>
              <span>{{ kpi.trend.text }}</span>
            </template>
          </div>
        </v-card>
      </v-col>

      <!-- Trends -->
      <v-col v-for="chart in charts" :key="chart.key" cols="12" md="6" :lg="12 / charts.length">
        <v-card color="surface" height="100%" :flat="config.vuetify.theme.flat" :class="config.vuetify.theme.rounded" class="pa-5" :data-test="`chart-${chart.key}`">
          <h2 class="text-title-medium">{{ chart.title }}</h2>
          <div class="text-body-small text-medium-emphasis mt-1 mb-4">{{ chart.note }}</div>
          <div v-if="chart.error" class="d-flex align-center ga-2 text-body-medium" data-test="error">
            <v-icon icon="fa-solid fa-circle-exclamation" color="error" size="small"></v-icon>
            <span>Couldn't load {{ chart.noun }}.</span>
            <v-btn variant="text" size="small" class="text-none" @click="load([chart.key])">Retry</v-btn>
          </div>
          <AdminWeeklyBarsComponent v-else-if="chart.weeks" :weeks="chart.weeks" :label="`${chart.title} per week`" />
          <div v-else class="admin-overview__placeholder"></div>
        </v-card>
      </v-col>

      <!-- Activity -->
      <v-col v-if="auditOn" cols="12" md="5">
        <v-card color="surface" height="100%" :flat="config.vuetify.theme.flat" :class="config.vuetify.theme.rounded" class="pa-5" data-test="top-actions">
          <h2 class="text-title-medium">Most frequent actions</h2>
          <div class="text-body-small text-medium-emphasis mt-1 mb-4">Last 12 weeks</div>
          <div v-if="statsErrors.includes('audit')" class="d-flex align-center ga-2 text-body-medium" data-test="error">
            <v-icon icon="fa-solid fa-circle-exclamation" color="error" size="small"></v-icon>
            <span>Couldn't load activity.</span>
            <v-btn variant="text" size="small" class="text-none" @click="load(['audit'])">Retry</v-btn>
          </div>
          <div v-else-if="stats.audit && !stats.audit.topActions.length" class="text-body-medium text-medium-emphasis">No activity recorded yet.</div>
          <ul v-else-if="stats.audit" class="admin-overview__list">
            <li v-for="item in stats.audit.topActions" :key="item.action" class="mb-3" data-test="action-row">
              <div class="d-flex align-baseline text-body-medium">
                <span class="text-truncate">{{ item.action }}</span>
                <v-spacer></v-spacer>
                <span class="admin-overview__num ml-4">{{ formatNumber(item.count) }}</span>
              </div>
              <v-progress-linear :model-value="(item.count / topActionMax) * 100" color="primary" height="4" rounded class="mt-1" aria-hidden="true"></v-progress-linear>
            </li>
          </ul>
        </v-card>
      </v-col>
      <v-col v-if="auditOn" cols="12" md="7">
        <v-card color="surface" height="100%" :flat="config.vuetify.theme.flat" :class="config.vuetify.theme.rounded" class="pa-5" data-test="recent">
          <h2 class="text-title-medium">Recent activity</h2>
          <div class="text-body-small text-medium-emphasis mt-1 mb-2">Latest recorded actions</div>
          <div v-if="statsErrors.includes('recent')" class="d-flex align-center ga-2 text-body-medium" data-test="error">
            <v-icon icon="fa-solid fa-circle-exclamation" color="error" size="small"></v-icon>
            <span>Couldn't load recent activity.</span>
            <v-btn variant="text" size="small" class="text-none" @click="load(['recent'])">Retry</v-btn>
          </div>
          <div v-else-if="stats.recent && !stats.recent.length" class="text-body-medium text-medium-emphasis mt-2">No activity recorded yet.</div>
          <ul v-else-if="stats.recent" class="admin-overview__list">
            <li v-for="item in stats.recent" :key="item._id || item.id" class="d-flex align-center py-2 admin-overview__row" data-test="recent-row">
              <div class="text-truncate">
                <div class="text-body-medium text-truncate">{{ item.action }}</div>
                <div v-if="item.targetType" class="text-body-small text-medium-emphasis">{{ item.targetType }}</div>
              </div>
              <v-spacer></v-spacer>
              <time class="text-body-small text-medium-emphasis ml-4 text-no-wrap" :datetime="item.createdAt" :title="formatDate(item.createdAt)">
                {{ timeAgo(item.createdAt) }}
              </time>
            </li>
          </ul>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
/**
 * Module dependencies.
 */
import { useAdminStore } from '../stores/admin.store';
import AdminWeeklyBarsComponent from '../components/admin.weeklyBars.component.vue';

/** Weeks in a KPI period when the API does not say (matches the audit stats default). */
const DEFAULT_PERIOD_WEEKS = 4;

/**
 * @desc Sum of the counts in the last `n` weeks of a series, `offset` periods back.
 * @param {Array<{count: number}>} weeks - weekly series, oldest first
 * @param {number} n - weeks per period
 * @param {number} [offset] - 0 = current period, 1 = the period before
 * @returns {number} sum
 */
const periodSum = (weeks, n, offset = 0) => {
  const end = weeks.length - offset * n;
  return weeks.slice(Math.max(0, end - n), end).reduce((sum, w) => sum + (w.count || 0), 0);
};

/**
 * Component definition.
 *
 * Overview tab of the admin section: main KPIs with their trend against the
 * previous period, weekly trend charts, then what the audit log records (most
 * frequent actions, latest events). Activity parts are hidden when audit
 * logging is disabled. Data comes from `useAdminStore().getStats()`.
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
    stats() {
      return useAdminStore().stats;
    },
    statsErrors() {
      return useAdminStore().statsErrors;
    },
    /** @returns {boolean} whether audit logging is on (same rule as the Activity tab) */
    auditOn() {
      return !(this.config.audit && this.config.audit.enabled === false);
    },
    /** @returns {number} weeks per KPI period */
    periodWeeks() {
      return this.stats.audit?.activeUsers?.periodWeeks || DEFAULT_PERIOD_WEEKS;
    },
    /** @returns {number} largest action count, for the bar lengths */
    topActionMax() {
      return Math.max(1, ...(this.stats.audit?.topActions || []).map((a) => a.count));
    },
    /** @returns {Array<object>} KPI cards, in display order */
    kpis() {
      const n = this.periodWeeks;
      const period = `the last ${n} weeks`;
      const created = (series) => {
        if (!series) return { value: null, caption: '', trend: null };
        const current = periodSum(series.weeks, n);
        return { value: series.total, caption: `${this.formatNumber(current)} new in ${period}`, trend: this.trend(current, periodSum(series.weeks, n, 1)) };
      };
      const list = [
        { key: 'users', label: 'Accounts', ...created(this.stats.users) },
        { key: 'organizations', label: 'Organizations', ...created(this.stats.organizations) },
      ];
      if (this.auditOn) {
        const audit = this.stats.audit;
        list.push(
          {
            key: 'active',
            label: 'Active accounts',
            value: audit ? audit.activeUsers.current : null,
            caption: `with at least one action in ${period}`,
            trend: audit ? this.trend(audit.activeUsers.current, audit.activeUsers.previous) : null,
          },
          {
            key: 'events',
            label: 'Actions',
            value: audit ? periodSum(audit.weeks, n) : null,
            caption: `recorded in ${period}`,
            trend: audit ? this.trend(periodSum(audit.weeks, n), periodSum(audit.weeks, n, 1)) : null,
          },
        );
      }
      return list;
    },
    /** @returns {Array<object>} trend charts, in display order */
    charts() {
      const list = [
        {
          key: 'users',
          title: 'New accounts',
          noun: 'accounts',
          note: 'Per week, last 12 weeks. Deleted accounts are not counted.',
          weeks: this.stats.users?.weeks,
          error: this.statsErrors.includes('users'),
        },
        {
          key: 'organizations',
          title: 'New organizations',
          noun: 'organizations',
          note: 'Per week, last 12 weeks. Deleted organizations are not counted.',
          weeks: this.stats.organizations?.weeks,
          error: this.statsErrors.includes('organizations'),
        },
      ];
      if (this.auditOn) {
        list.push({
          key: 'audit',
          title: 'Actions',
          noun: 'activity',
          note: 'Per week, last 12 weeks, from the audit log.',
          weeks: this.stats.audit?.weeks,
          error: this.statsErrors.includes('audit'),
        });
      }
      return list;
    },
  },
  mounted() {
    this.load();
  },
  methods: {
    /**
     * @desc Fetch the Overview sources (all, or only the ones named, for a retry).
     * @param {string[]} [only] - sources to reload
     * @returns {Promise<void>}
     */
    async load(only) {
      this.loading = true;
      try {
        await useAdminStore().getStats({ audit: this.auditOn, only });
      } finally {
        this.loading = false;
      }
    },
    /**
     * @desc Describe the change between two periods.
     * @param {number} current - count in the current period
     * @param {number} previous - count in the period before
     * @returns {{ text: string, icon: string|null, class: string }} trend line
     */
    trend(current, previous) {
      const vs = `vs previous ${this.periodWeeks} weeks`;
      if (current === previous) return { text: `No change ${vs}`, icon: null, class: 'text-medium-emphasis' };
      const up = current > previous;
      const pct = previous === 0 ? 0 : Math.round((Math.abs(current - previous) / previous) * 100);
      const dir = up ? 'Up' : 'Down';
      const text = previous === 0 ? `Up from 0 ${vs}` : pct === 0 ? `${dir} less than 1% ${vs}` : `${dir} ${pct}% ${vs}`;
      return {
        text,
        icon: up ? 'fa-solid fa-arrow-trend-up' : 'fa-solid fa-arrow-trend-down',
        class: up ? 'text-success' : 'text-error',
      };
    },
    /**
     * @desc Format a count with thousands separators.
     * @param {number} n - count
     * @returns {string} formatted count
     */
    formatNumber(n) {
      return Number(n || 0).toLocaleString('en-US');
    },
    /**
     * @desc Full date and time, for the tooltip of a recent event.
     * @param {string} iso - ISO date
     * @returns {string} formatted date
     */
    formatDate(iso) {
      const d = new Date(iso);
      return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
    },
    /**
     * @desc Short relative time, e.g. "5 min ago", "3 days ago".
     * @param {string} iso - ISO date
     * @returns {string} relative time
     */
    timeAgo(iso) {
      const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
      if (Number.isNaN(seconds)) return '';
      const rtf = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto', style: 'short' });
      const steps = [
        [60, 'second', 1],
        [3600, 'minute', 60],
        [86400, 'hour', 3600],
        [604800, 'day', 86400],
        [Infinity, 'week', 604800],
      ];
      const [, unit, size] = steps.find(([limit]) => seconds < limit);
      return rtf.format(-Math.round(seconds / size), unit);
    },
  },
};
</script>

<style scoped>
.admin-overview__num {
  font-variant-numeric: tabular-nums;
}
.admin-overview__line {
  min-height: 1.25rem;
}
.admin-overview__placeholder {
  height: 182px;
}
.admin-overview__list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.admin-overview__row + .admin-overview__row {
  border-top: 1px solid rgba(var(--v-border-color), 0.08);
}
</style>
