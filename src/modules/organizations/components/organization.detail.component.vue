<template>
  <div>
    <!-- Layout chrome: header + tab bar, guttered with their own container.
         pb-0 collapses the gap below tabs — child router-view supplies its own top padding. -->
    <v-container fluid class="pb-0">
      <CorePageHeaderTabs
        :title="viewedOrganization ? viewedOrganization.name : 'Organization'"
        :tabs="config.organizations.tabs"
        :can="abilityCan"
        :base-path="basePath"
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
      </CorePageHeaderTabs>
    </v-container>

    <!-- Active child route renders outside the layout container so each child's
         own root <v-container> provides exactly one gutter (no double-nesting). -->
    <router-view />

    <!-- Delete confirmation dialog (layout-level: visible from any tab) -->
    <coreConfirmDialog
      v-model="confirmDelete"
      title="Delete Organization"
      :confirm-text="deleteConfirmTarget"
      confirm-label="Delete"
      confirm-color="error"
      @confirm="remove"
    >
      <p class="mb-4">
        This action <strong>cannot be undone</strong>. All members will lose access.
      </p>
      <p class="mb-2 text-body-small text-medium-emphasis">
        Type <strong>{{ deleteConfirmTarget }}</strong> to confirm:
      </p>
    </coreConfirmDialog>
  </div>
</template>

<script>
import { subject } from '@casl/ability';
import { useRoute } from 'vue-router';
import { ability } from '../../../lib/helpers/ability';
import { useOrganizationsStore } from '../stores/organizations.store';
import CorePageHeaderTabs from '../../core/components/core.pageHeaderTabs.component.vue';
import orgAvatarComponent from '../../core/components/org.avatar.component.vue';
import coreConfirmDialog from '../../core/components/core.confirmDialog.component.vue';

export default {
  name: 'OrganizationDetailComponent',
  components: {
    CorePageHeaderTabs,
    orgAvatarComponent,
    coreConfirmDialog,
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
    /**
     * @desc Organization name used as the typed-confirmation target for the
     *       delete dialog. The delete trigger button is already gated by
     *       `v-if="viewedOrganization && canManage"`, so `confirmDelete` can
     *       only become true once the org is loaded and this value is non-empty.
     *       Falls back to '' as a safety net (coreConfirmDialog treats an empty
     *       confirmText as no typed gate, but the trigger guard prevents that
     *       state from being reachable in practice).
     * @returns {string}
     */
    deleteConfirmTarget() {
      return this.viewedOrganization?.name || '';
    },
  },
  watch: {
    /**
     * @desc Re-fetch organization when the route param changes (component instance reuse).
     * @returns {Promise<void>}
     */
    async resolvedOrganizationId() {
      const organizationsStore = useOrganizationsStore();
      organizationsStore.resetOrganization();
      if (this.resolvedOrganizationId) {
        await organizationsStore.fetchOrganization(this.resolvedOrganizationId);
      }
    },
  },
  /**
   * @desc Fetch the organization on initial mount so the header and tab bar have data.
   * @returns {Promise<void>}
   */
  async created() {
    const organizationsStore = useOrganizationsStore();
    organizationsStore.resetOrganization();
    if (this.resolvedOrganizationId) {
      await organizationsStore.fetchOrganization(this.resolvedOrganizationId);
    }
  },
  methods: {
    /**
     * @desc Delete the viewed organization after confirmation and navigate back.
     * @returns {Promise<void>}
     */
    async remove() {
      const organizationsStore = useOrganizationsStore();
      try {
        await organizationsStore.deleteOrganization(this.resolvedOrganizationId);
        this.confirmDelete = false;
        this.$router.push(this.backRoute);
      } catch {
        // interceptor handles snackbar
      }
    },
  },
};
</script>
