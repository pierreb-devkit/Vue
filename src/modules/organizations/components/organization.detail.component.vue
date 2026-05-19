<template>
  <div>
    <!-- Layout chrome: header + tab bar, guttered with their own container -->
    <v-container fluid>
      <!-- Header -->
      <PageHeader
        :title="viewedOrganization ? viewedOrganization.name : 'Organization'"
      >
        <template #avatar>
          <orgAvatarComponent v-if="viewedOrganization" :org="viewedOrganization" :size="40" class="mr-3" />
        </template>
        <template #actions>
          <v-btn
            v-if="viewedOrganization && canManage"
            color="error"
            variant="tonal"
            class="text-none text-body-medium mr-2"
            :class="config.vuetify.theme.rounded"
            @click="confirmDelete = true"
          >
            <v-icon icon="fa-solid fa-trash" size="small" class="mr-2"></v-icon>
            Delete
          </v-btn>
        </template>
      </PageHeader>

      <!-- Tab bar (config-driven, CASL-gated) -->
      <CoreSurfaceTabBar
        :tabs="config.organizations.tabs"
        :can="abilityCan"
        :base-path="basePath"
      />
    </v-container>

    <!-- Active child route renders outside the layout container so each child's
         own root <v-container> provides exactly one gutter (no double-nesting). -->
    <router-view />

    <!-- Delete confirmation dialog (layout-level: visible from any tab) -->
    <v-dialog v-model="confirmDelete" max-width="440">
      <v-card :class="config.vuetify.theme.rounded" class="pa-4">
        <v-card-title class="text-title-large font-weight-medium">Delete Organization</v-card-title>
        <v-card-text class="text-body-medium">
          <p class="mb-4">
            This action <strong>cannot be undone</strong>. All members will lose access.
          </p>
          <p class="mb-2 text-body-small text-medium-emphasis">
            Type <strong>{{ viewedOrganization?.name }}</strong> to confirm:
          </p>
          <v-text-field
            v-model="deleteConfirmName"
            variant="outlined"
            density="comfortable"
            :placeholder="viewedOrganization?.name"
            autofocus
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" class="text-none text-body-medium" @click="confirmDelete = false; deleteConfirmName = ''">Cancel</v-btn>
          <v-btn
            color="error"
            variant="flat"
            :class="config.vuetify.theme.rounded"
            class="text-none text-body-medium"
            :disabled="deleteConfirmName !== viewedOrganization?.name"
            @click="remove"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { subject } from '@casl/ability';
import { useRoute } from 'vue-router';
import { ability } from '../../../lib/helpers/ability';
import { useOrganizationsStore } from '../stores/organizations.store';
import PageHeader from '../../core/components/core.pageHeader.component.vue';
import orgAvatarComponent from '../../core/components/org.avatar.component.vue';
import CoreSurfaceTabBar from '../../core/components/core.surfaceTabBar.component.vue';

export default {
  name: 'OrganizationDetailComponent',
  components: {
    PageHeader,
    orgAvatarComponent,
    CoreSurfaceTabBar,
  },
  props: {
    organizationId: { type: String, default: null },
    backRoute: { type: String, default: '/users' },
  },
  /**
   * @desc Wires route access for reactive basePath computation.
   * @returns {{ route: import('vue-router').RouteLocationNormalizedLoaded }}
   */
  setup() {
    const route = useRoute();
    return { route };
  },
  data() {
    return {
      confirmDelete: false,
      deleteConfirmName: '',
    };
  },
  computed: {
    /**
     * @desc Resolves the organization ID from `route.params.organizationId`
     *       (present on both user and admin routes) or falls back to the
     *       `organizationId` prop (a static fallback; admin route props only
     *       supply `backRoute`, not the ID). Route params take precedence.
     * @returns {string|null}
     */
    resolvedOrganizationId() {
      return (this.route && this.route.params && this.route.params.organizationId)
        || this.organizationId
        || null;
    },
    viewedOrganization() {
      return useOrganizationsStore().viewedOrganization;
    },
    canManage() {
      if (ability && ability.rules && ability.rules.length > 0) {
        return ability.can('update', subject('Organization', { _id: this.resolvedOrganizationId }));
      }
      return false;
    },
    /**
     * @desc RESOLVED base path for CoreSurfaceTabBar — uses the actual
     *       organizationId value, never the raw `:organizationId` pattern.
     *       Route-aware: admin routes → `/admin/organizations/{id}`,
     *       user routes → `/users/organizations/{id}`.
     *       Example: `/users/organizations/abc123`
     * @returns {string}
     */
    basePath() {
      const isAdmin = this.route && this.route.path && this.route.path.startsWith('/admin');
      const prefix = isAdmin ? '/admin/organizations' : '/users/organizations';
      return `${prefix}/${this.resolvedOrganizationId}`;
    },
    /**
     * @desc Bound CASL predicate passed to CoreSurfaceTabBar.
     *       Re-evaluates whenever the reactive `ability` instance updates.
     * @returns {Function}
     */
    abilityCan() {
      return (action, subjectName) => ability.can(action, subjectName);
    },
  },
  async created() {
    const organizationsStore = useOrganizationsStore();
    organizationsStore.resetOrganization();
    if (this.resolvedOrganizationId) {
      await organizationsStore.fetchOrganization(this.resolvedOrganizationId);
    }
  },
  methods: {
    async remove() {
      const organizationsStore = useOrganizationsStore();
      try {
        await organizationsStore.deleteOrganization(this.resolvedOrganizationId);
        this.confirmDelete = false;
        this.deleteConfirmName = '';
        this.$router.push(this.backRoute);
      } catch {
        // interceptor handles snackbar
      }
    },
  },
};
</script>
