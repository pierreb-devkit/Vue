<template>
  <v-container fluid>
    <v-row class="pa-2 mt-0">
      <v-col v-for="series in seriesList" :key="series.key" cols="12" md="6">
        <v-card color="surface" height="100%" :flat="config.vuetify.theme.flat" :class="config.vuetify.theme.rounded" :data-test="`series-${series.key}`">
          <v-progress-linear :active="loading" indeterminate color="primary"></v-progress-linear>
          <div class="d-flex align-start pt-5 px-6">
            <div>
              <h2 class="text-title-medium">{{ series.title }}</h2>
              <div class="text-headline-medium admin-overview__num mt-1">
                <span v-if="series.stats" data-test="total">{{ formatNumber(series.stats.total) }}</span>
                <span v-else class="text-medium-emphasis" data-test="total">—</span>
              </div>
              <div class="text-body-small text-medium-emphasis mt-1 admin-overview__sub" data-test="this-week">
                <template v-if="series.stats">{{ formatNumber(thisWeek(series.stats)) }} new this week</template>
              </div>
            </div>
            <v-spacer></v-spacer>
            <v-btn variant="text" size="small" class="text-none" :to="series.to">View all</v-btn>
          </div>
          <div class="px-6 pb-6 pt-6">
            <div class="text-body-small text-medium-emphasis mb-3">
              New {{ series.noun }} per week, last 12 weeks. Deleted {{ series.noun }} are not counted.
            </div>
            <div v-if="series.error" class="d-flex align-center ga-2 text-body-medium" data-test="error">
              <v-icon icon="fa-solid fa-circle-exclamation" color="error" size="small"></v-icon>
              <span>Couldn't load {{ series.noun }}.</span>
              <v-btn variant="text" size="small" class="text-none" @click="load">Retry</v-btn>
            </div>
            <AdminWeeklyBarsComponent v-else-if="series.stats" :weeks="series.stats.weeks" :label="`New ${series.noun} per week`" />
            <div v-else class="admin-overview__placeholder"></div>
          </div>
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

/**
 * Component definition.
 *
 * Overview tab of the admin section — for accounts and organizations, the
 * total, the count created this week and a 12-week chart of new records.
 * Data comes from the per-module admin stats routes via
 * `useAdminStore().getStats()`.
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
    /** @returns {Array<object>} one entry per card */
    seriesList() {
      return [
        {
          key: 'users',
          title: 'Accounts',
          noun: 'accounts',
          to: '/admin/users',
          stats: this.stats.users,
          error: this.statsErrors.includes('users'),
        },
        {
          key: 'organizations',
          title: 'Organizations',
          noun: 'organizations',
          to: '/admin/organizations',
          stats: this.stats.organizations,
          error: this.statsErrors.includes('organizations'),
        },
      ];
    },
  },
  mounted() {
    this.load();
  },
  methods: {
    /**
     * @desc Fetch both stats series.
     * @returns {Promise<void>}
     */
    async load() {
      this.loading = true;
      try {
        await useAdminStore().getStats();
      } finally {
        this.loading = false;
      }
    },
    /**
     * @desc Count created in the current (last) week of a series.
     * @param {{ weeks?: Array<{count: number}> }} stats - series stats
     * @returns {number} count, 0 when the series is empty
     */
    thisWeek(stats) {
      const weeks = stats?.weeks || [];
      return weeks.length ? weeks[weeks.length - 1].count : 0;
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
.admin-overview__sub {
  min-height: 1.25rem;
}
.admin-overview__placeholder {
  height: 182px;
}
</style>
