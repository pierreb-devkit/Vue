<template>
  <v-card color="surface" :flat="config.vuetify.theme.flat" :class="config.vuetify.theme.rounded" class="pa-6">
    <div class="d-flex align-center justify-end mb-4">
      <v-btn
        v-if="id"
        color="error"
        variant="tonal"
        :class="config.vuetify.theme.rounded"
        class="text-none text-body-medium"
        @click="removeConfirm = true"
      >
        <v-icon icon="fa-solid fa-trash" size="small" class="mr-2"></v-icon>Delete
      </v-btn>
    </div>
    <accountUserProfileComponent :user="user" @save="update" @avatar-uploaded="onAvatarUploaded" />
    <coreConfirmDialog
      v-model="removeConfirm"
      title="Delete this user?"
      message="Are you sure you want to delete this user? This action cannot be undone."
      confirm-label="Delete"
      confirm-color="error"
      :loading="removing"
      @confirm="remove"
    />
  </v-card>
</template>

<script>
import { useAdminStore } from '../stores/admin.store';
import accountUserProfileComponent from '../../users/components/user.profile.component.vue';
import coreConfirmDialog from '../../core/components/core.confirmDialog.component.vue';

export default {
  name: 'AdminUserView',
  components: { accountUserProfileComponent, coreConfirmDialog },
  data() {
    return { removeConfirm: false, removing: false };
  },
  computed: {
    /**
     * @desc Resolve the route :id param, or null when missing.
     * @returns {string|null}
     */
    id() {
      return this.$route.params.id || null;
    },
    /**
     * @desc Current admin-store user record.
     * @returns {object|null}
     */
    user() {
      return useAdminStore().user;
    },
  },
  watch: {
    id: {
      immediate: true,
      async handler() {
        await this.loadUser();
      },
    },
    user: {
      immediate: true,
      handler(u) { this.publishBreadcrumb(u); },
    },
  },
  beforeUnmount() {
    useAdminStore().clearBreadcrumb();
  },
  methods: {
    /**
     * @desc Publish the user's name (or email fallback) as the admin layout's
     *       current breadcrumb. Cleared on unmount.
     * @param {object|null} u - The current user record.
     */
    publishBreadcrumb(u) {
      if (!u || (!u.firstName && !u.lastName && !u.email)) return;
      const title = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email;
      useAdminStore().setBreadcrumb({ title, titleClass: 'text-capitalize' });
    },
    /**
     * @desc Reset the admin-store user record and re-fetch the targeted user.
     * @returns {Promise<void>}
     */
    async loadUser() {
      const store = useAdminStore();
      store.resetUser();
      if (this.id) {
        try { await store.getUser({ id: this.id }); } catch (err) { console.error(err); }
      }
    },
    /**
     * @desc Persist a user-profile change via the admin store.
     * @param {object} formData - Form payload from accountUserProfileComponent.
     * @returns {Promise<void>}
     */
    async update(formData) {
      try { await useAdminStore().updateUser({ id: this.id }, formData); } catch (err) { console.error(err); }
    },
    /**
     * @desc Refresh the local user record after an avatar upload.
     * @returns {Promise<void>}
     */
    async onAvatarUploaded() {
      if (this.id) await useAdminStore().getUser({ id: this.id });
    },
    /**
     * @desc Confirm-and-execute deletion. Navigates to /admin/users on success
     *       so the list view re-fetches the updated record set.
     * @returns {Promise<void>}
     */
    async remove() {
      if (this.removing) return;
      this.removing = true;
      try {
        await useAdminStore().deleteUser({ id: this.id });
        this.$router.push('/admin/users');
      } catch (err) {
        console.error(err);
      } finally {
        this.removing = false;
      }
    },
  },
};
</script>
