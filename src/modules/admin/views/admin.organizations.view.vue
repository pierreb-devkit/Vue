<template>
  <v-container fluid>
    <v-row class="pa-2 mt-0">
      <v-col cols="12">
        <coreDataTableComponent :headers="orgHeaders" :items="organizations" :fetch-action="fetchOrganizations">
          <template #orgName="{ item }">
            <router-link
              :to="'/admin/organizations/' + (item.id || item._id)"
              class="text-capitalize text-primary text-decoration-none font-weight-medium"
              >{{ item.name }}</router-link
            >
          </template>
        </coreDataTableComponent>
      </v-col>
    </v-row>
  </v-container>
</template>
<script>
/**
 * Module dependencies.
 */
import { useAdminStore } from '../stores/admin.store';
import coreDataTableComponent from '../../core/components/core.datatable.component.vue';

/**
 * Component definition.
 *
 * Organizations tab of the admin section — renders the organizations list
 * as a `coreDataTableComponent`. Mounted as a routed child of
 * `admin.layout.vue` at `/admin/organizations`.
 */
export default {
  name: 'AdminOrganizations',
  components: {
    coreDataTableComponent,
  },
  data() {
    return {
      orgHeaders: [
        { text: 'Name', value: 'name', kind: 'slot', slotName: 'orgName' },
        { text: 'Members', value: 'memberCount', kind: 'text' },
        { text: 'Domain', value: 'domain', kind: 'text' },
        { text: 'Plan', value: 'plan', kind: 'text' },
        { text: 'Created', value: 'createdAt', kind: 'date', format: 'DD/MM/YY' },
      ],
    };
  },
  computed: {
    organizations() {
      return useAdminStore().organizations;
    },
  },
  methods: {
    /**
     * @desc Fetch the organizations list from the admin store.
     *       `coreDataTableComponent` forwards a pagination query-string
     *       (e.g. `'0&5&search'`) that the store interpolates into the
     *       request URL.
     * @param {string} [pageRequest] - Optional pagination query-string segment.
     * @returns {Promise<void>}
     */
    async fetchOrganizations(pageRequest) {
      await useAdminStore().getOrganizations(pageRequest);
    },
  },
};
</script>
