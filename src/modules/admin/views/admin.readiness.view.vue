<template>
  <v-container fluid class="pa-0">
    <div class="pa-4">
      <v-card width="100%" color="surface" :flat="config.vuetify.theme.flat" :class="config.vuetify.theme.rounded">
        <v-progress-linear :active="readinessLoading" indeterminate color="primary"></v-progress-linear>
        <v-table v-if="readiness.length"
          ><thead>
            <tr>
              <th class="text-left text-label-medium">Category</th>
              <th class="text-left text-label-medium">Status</th>
              <th class="text-left text-label-medium">Message</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in readiness" :key="item.category">
              <td class="text-body-medium text-capitalize">{{ item.category }}</td>
              <td>
                <v-icon :icon="readinessIcon(item.status)" :color="readinessColor(item.status)" size="small" class="mr-2"></v-icon
                ><v-chip :color="readinessColor(item.status)" size="small" variant="tonal">{{ item.status }}</v-chip>
              </td>
              <td class="text-body-medium">{{ item.message }}</td>
            </tr>
          </tbody></v-table
        >
        <div v-if="!readinessLoading && !readiness.length" class="pa-4 text-medium-emphasis text-body-medium">No readiness data available.</div>
      </v-card>
    </div>
  </v-container>
</template>
<script>
/**
 * Module dependencies.
 */
import { useAdminStore } from '../stores/admin.store';

/**
 * Component definition.
 *
 * Readiness tab of the admin section — renders a table of readiness checks
 * from the admin store. Fetches on `mounted()` since it is now a routed
 * view (no parent tab model to watch). Mounted as a routed child of
 * `admin.layout.vue` at `/admin/readiness`.
 */
export default {
  name: 'AdminReadiness',
  data() {
    return {
      readinessLoading: false,
    };
  },
  computed: {
    readiness() {
      return useAdminStore().readiness;
    },
  },
  mounted() {
    this.fetchReadiness();
  },
  methods: {
    /**
     * @desc Map readiness status to icon name.
     * @param {string} status - ok, warning, or error
     * @returns {string} FontAwesome icon class
     */
    readinessIcon(status) {
      if (status === 'ok') return 'fa-solid fa-circle-check';
      if (status === 'error') return 'fa-solid fa-circle-xmark';
      return 'fa-solid fa-triangle-exclamation';
    },
    /**
     * @desc Map readiness status to color.
     * @param {string} status - ok, warning, or error
     * @returns {string} Vuetify color name
     */
    readinessColor(status) {
      if (status === 'ok') return 'success';
      if (status === 'error') return 'error';
      return 'warning';
    },
    /**
     * @desc Fetch readiness data from admin store. Loading flag is always
     *       cleared via `finally`, even if the store action rejects, so the
     *       view never gets stuck on the progress bar.
     * @returns {Promise<void>}
     */
    async fetchReadiness() {
      this.readinessLoading = true;
      try {
        await useAdminStore().getReadiness();
      } finally {
        this.readinessLoading = false;
      }
    },
  },
};
</script>
