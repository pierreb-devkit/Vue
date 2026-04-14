<template>
  <v-container fluid class="pa-0">
    <div class="pa-4">
      <coreDataTableComponent :headers="orgHeaders" :items="organizations" :fetch-action="fetchOrganizations"
        ><template #orgName="{ item }"
          ><router-link
            :to="'/admin/organizations/' + (item.id || item._id)"
            class="text-capitalize text-primary text-decoration-none font-weight-medium"
            >{{ item.name }}</router-link
          ></template
        ></coreDataTableComponent
      >
    </div>
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
     * @param {object} [params] - Optional query params forwarded to the store.
     * @returns {Promise<void>}
     */
    async fetchOrganizations(params) {
      await useAdminStore().getOrganizations(params);
    },
  },
};
</script>
