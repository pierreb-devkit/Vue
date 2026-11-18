<!--
  AdminWeeklyBarsComponent
  ========================
  Columns per week with a y-scale, no chart dependency. One hue (primary)
  on the data, faint gridlines, round integer ticks above the maximum,
  first / middle / last week labelled on the x axis.

  USAGE:
  <AdminWeeklyBarsComponent :weeks="[{ week: '2026-11-16', count: 3 }]" label="New accounts per week" />
-->
<template>
  <figure class="admin-weekly-bars ma-0" :aria-label="ariaLabel" role="img">
    <div class="admin-weekly-bars__plot">
      <div class="admin-weekly-bars__ticks text-label-small text-medium-emphasis" aria-hidden="true">
        <span v-for="tick in ticks" :key="tick" :style="{ bottom: `${(tick / scaleMax) * 100}%` }">{{ tick }}</span>
      </div>
      <div class="admin-weekly-bars__area">
        <div
          v-for="tick in ticks"
          :key="`grid-${tick}`"
          class="admin-weekly-bars__grid"
          :class="{ 'admin-weekly-bars__grid--base': tick === 0 }"
          :style="{ bottom: `${(tick / scaleMax) * 100}%` }"
          aria-hidden="true"
        ></div>
        <div
          v-for="item in weeks"
          :key="item.week"
          class="admin-weekly-bars__col"
          :title="`Week of ${formatWeek(item.week)}: ${item.count}`"
        >
          <div v-if="item.count > 0" class="admin-weekly-bars__bar bg-primary" :style="{ height: `${(item.count / scaleMax) * 100}%` }"></div>
        </div>
      </div>
    </div>
    <div class="admin-weekly-bars__axis text-label-small text-medium-emphasis" aria-hidden="true">
      <span v-for="(item, i) in weeks" :key="`x-${item.week}`">{{ xLabelIndexes.includes(i) ? formatWeek(item.week) : '' }}</span>
    </div>
  </figure>
</template>

<script>
/**
 * @desc Smallest "nice" integer (1, 2 or 5 × 10^n, at least 4) at or above `value`.
 * @param {number} value - series maximum
 * @returns {number} scale top
 */
const niceCeil = (value) => {
  if (value <= 4) return 4;
  const power = 10 ** Math.floor(Math.log10(value));
  const n = value / power;
  let mult = 10;
  if (n <= 1) mult = 1;
  else if (n <= 2) mult = 2;
  else if (n <= 5) mult = 5;
  return mult * power;
};

export default {
  name: 'AdminWeeklyBarsComponent',

  props: {
    /**
     * @desc Weekly series, oldest first: `{ week: 'YYYY-MM-DD' (Monday), count: number }`.
     */
    weeks: {
      type: Array,
      required: true,
    },
    /**
     * @desc What the series counts, read by screen readers.
     */
    label: {
      type: String,
      required: true,
    },
  },

  computed: {
    /** @returns {number} top of the y scale (strictly above the max when the max is not round) */
    scaleMax() {
      const max = Math.max(0, ...this.weeks.map((w) => w.count || 0));
      return niceCeil(max);
    },
    /** @returns {number[]} integer y ticks, top first */
    ticks() {
      const half = this.scaleMax / 2;
      return Number.isInteger(half) ? [this.scaleMax, half, 0] : [this.scaleMax, 0];
    },
    /** @returns {number[]} indexes of the weeks that carry an x label */
    xLabelIndexes() {
      const n = this.weeks.length;
      if (n <= 2) return [...Array(n).keys()];
      return [0, Math.floor((n - 1) / 2), n - 1];
    },
    /** @returns {string} text alternative for the whole chart */
    ariaLabel() {
      const total = this.weeks.reduce((sum, w) => sum + (w.count || 0), 0);
      if (!this.weeks.length) return `${this.label}: no data`;
      return `${this.label}: ${total} over ${this.weeks.length} weeks, from the week of ${this.formatWeek(this.weeks[0].week)}`;
    },
  },

  methods: {
    /**
     * @desc Short label for a week's Monday, e.g. "Nov 16".
     * @param {string} week - ISO date (YYYY-MM-DD)
     * @returns {string} formatted date
     */
    formatWeek(week) {
      const d = new Date(`${week}T00:00:00Z`);
      if (Number.isNaN(d.getTime())) return week;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
    },
  },
};
</script>

<style scoped>
.admin-weekly-bars__plot {
  display: flex;
  height: 160px;
}
.admin-weekly-bars__ticks {
  position: relative;
  width: 32px;
  flex: none;
}
.admin-weekly-bars__ticks span {
  position: absolute;
  right: 8px;
  transform: translateY(50%);
  font-variant-numeric: tabular-nums;
}
.admin-weekly-bars__area {
  position: relative;
  flex: 1;
  display: flex;
  align-items: flex-end;
  gap: 4px;
}
.admin-weekly-bars__grid {
  position: absolute;
  left: 0;
  right: 0;
  border-top: 1px solid rgba(var(--v-border-color), 0.08);
}
.admin-weekly-bars__grid--base {
  border-top-color: rgba(var(--v-border-color), 0.24);
}
.admin-weekly-bars__col {
  position: relative;
  flex: 1;
  height: 100%;
  display: flex;
  align-items: flex-end;
}
.admin-weekly-bars__bar {
  width: 100%;
  border-radius: 2px 2px 0 0;
}
.admin-weekly-bars__axis {
  display: flex;
  gap: 4px;
  margin-left: 32px;
  margin-top: 6px;
}
.admin-weekly-bars__axis span {
  flex: 1;
  white-space: nowrap;
  text-align: center;
  overflow: visible;
}
.admin-weekly-bars__axis span:first-child {
  text-align: left;
}
.admin-weekly-bars__axis span:last-child {
  text-align: right;
}
</style>
