<template>
  <v-container fluid>
    <PageHeader icon="fa-solid fa-building" title="Create Organization" />
    <v-row class="pa-2 mt-0" justify="center">
      <v-col cols="12" sm="10" md="8" lg="6">
        <v-card class="pa-8" color="surface" :flat="config.vuetify.theme.flat" :class="config.vuetify.theme.rounded">
          <h3 class="text-title-large font-weight-medium mb-6">Organization Details</h3>

          <!-- Error alert -->
          <v-alert
            v-if="error"
            type="error"
            variant="tonal"
            class="mb-4"
            :class="config.vuetify.theme.rounded"
            closable
            @click:close="error = null"
          >
            <div class="d-flex align-center flex-wrap ga-2">
              <span class="flex-grow-1">{{ error }}</span>
              <v-btn
                v-if="pendingOrg"
                variant="tonal"
                color="error"
                size="small"
                :class="config.vuetify.theme.rounded"
                class="text-none"
                :loading="retrying"
                @click="retryRefresh"
              >
                Retry
              </v-btn>
            </div>
          </v-alert>

          <v-form ref="form" v-model="valid">
            <v-text-field
              v-model="name"
              label="Organization Name"
              :rules="[rules.required]"
              variant="outlined"
              density="comfortable"
              placeholder="e.g. Acme Inc."
              class="mb-2"
            ></v-text-field>
            <v-textarea
              v-model="description"
              label="Description"
              variant="outlined"
              density="comfortable"
              rows="3"
              placeholder="What does this organization do?"
              class="mb-4"
            ></v-textarea>
            <v-row>
              <v-spacer></v-spacer>
              <v-btn variant="text" class="text-none text-body-medium mr-2" to="/users">Cancel</v-btn>
              <v-btn
                :disabled="pendingOrg ? retrying : (!valid || loading)"
                :loading="pendingOrg ? retrying : loading"
                color="primary"
                variant="flat"
                :class="config.vuetify.theme.rounded"
                class="text-none text-body-medium"
                data-test="organization-create-primary-action"
                @click="handlePrimaryAction"
              >
                {{ pendingOrg ? 'Retry' : 'Create Organization' }}
              </v-btn>
            </v-row>
          </v-form>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { useOrganizationsStore } from '../stores/organizations.store';
import { useAuthStore } from '../../auth/stores/auth.store';
import PageHeader from '../../core/components/core.pageHeader.component.vue';

export default {
  name: 'OrganizationCreateView',
  components: { PageHeader },
  data() {
    return {
      valid: false,
      loading: false,
      retrying: false,
      error: null,
      name: '',
      description: '',
      // { org, isFirstOrg } captured when a post-create soft-refresh does not
      // (yet) populate currentOrganization — lets retryRefresh() re-attempt
      // the refresh without recreating the organization.
      pendingOrg: null,
      rules: { required: (v) => (!!v && !!v.trim()) || 'Required' },
    };
  },
  methods: {
    /**
     * @desc Route the primary button's click. While a post-create soft-refresh
     *       is pending (pendingOrg set — the organization already exists
     *       server-side), always retry the refresh instead of creating again,
     *       regardless of whether the error alert was dismissed in the meantime:
     *       dismissing the alert only clears `error` (`@click:close` above), it
     *       must never re-enable a second createOrganization() call for the same
     *       pending org. Without this, dismissing the banner left the primary
     *       "Create Organization" button pointed at create(), producing a
     *       duplicate org on click (#4459 follow-up).
     * @returns {Promise<void>}
     */
    async handlePrimaryAction() {
      if (this.pendingOrg) {
        await this.retryRefresh();
        return;
      }
      await this.create();
    },
    /**
     * @desc Validate the form and create the organization, then route the user:
     *       a first org (no current org yet) lands in the app via sign.route; an
     *       additional org created while one is active goes to its detail page.
     * @returns {Promise<void>}
     */
    async create() {
      if (this.loading) return;
      const form = await this.$refs.form.validate();
      if (form.valid) {
        this.loading = true;
        this.error = null;
        this.pendingOrg = null;
        const organizationsStore = useOrganizationsStore();
        const authStore = useAuthStore();
        // No current org (a first org, or a management user who just deleted their
        // active one) is an onboarding-like step: land in the app via sign.route.
        // An additional org created while one is already active keeps the
        // -> org-detail destination. Captured BEFORE create, since the backend sets
        // currentOrganization when the user had none.
        const isFirstOrg = !authStore.user?.currentOrganization;
        try {
          const org = await organizationsStore.createOrganization({
            name: this.name,
            description: this.description,
          });
          if (org) {
            await this.refreshAndNavigate(authStore, org, isFirstOrg);
          }
        } catch (err) {
          this.error = err?.response?.data?.message || err?.message || 'Could not create organization. Please try again.';
        } finally {
          this.loading = false;
        }
      }
    },
    /**
     * @desc Soft-refresh the session (token(), never throws) to pick up the new
     *       org context, then navigate — but only if the refresh actually
     *       populated authStore.user.currentOrganization. token() swallows
     *       failures internally, so a transient blip leaves currentOrganization
     *       falsy; navigating anyway would have the app-router org-guard bounce
     *       the just-created org back to /organization-required. refreshAbilities()
     *       signs out + rethrows on failure, which would eject a user who just
     *       created their org, so token() stays the right primitive here — this
     *       guard just mirrors organizations.required.view.vue's refresh()/
     *       acceptInvitation() currentOrganization check on its result instead of
     *       assuming success. On a stalled refresh the organization already
     *       exists server-side, so it is kept in pendingOrg for a manual retry
     *       instead of being lost behind a generic error.
     * @param {Object} authStore - The auth store instance.
     * @param {Object} org - The just-created organization.
     * @param {boolean} isFirstOrg - Captured before create(); see create() above.
     * @returns {Promise<void>}
     */
    async refreshAndNavigate(authStore, org, isFirstOrg) {
      await authStore.token();
      if (!authStore.user?.currentOrganization) {
        this.pendingOrg = { org, isFirstOrg };
        this.error = 'Organization created, but we could not refresh your session. Please retry.';
        return;
      }
      this.pendingOrg = null;
      this.$router.push(
        isFirstOrg ? this.config.sign.route : `/users/organizations/${org.id || org._id}`,
      );
    },
    /**
     * @desc Re-attempt the post-create soft refresh without recreating the
     *       organization (it already exists server-side from the original create()).
     * @returns {Promise<void>}
     */
    async retryRefresh() {
      if (!this.pendingOrg || this.retrying) return;
      this.retrying = true;
      this.error = null;
      const authStore = useAuthStore();
      const { org, isFirstOrg } = this.pendingOrg;
      try {
        await this.refreshAndNavigate(authStore, org, isFirstOrg);
      } finally {
        this.retrying = false;
      }
    },
  },
};
</script>
