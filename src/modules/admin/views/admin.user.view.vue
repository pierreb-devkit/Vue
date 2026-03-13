<template>
  <v-container fluid>
    <!-- Header -->
    <PageHeader
      icon="fa-solid fa-user"
      :title="`${user.firstName || ''} ${user.lastName || ''}`"
      title-class="text-capitalize"
    >
      <template #actions>
        <v-btn
          v-if="id"
          color="error"
          variant="tonal"
          :class="config.vuetify.theme.rounded"
          class="text-none text-body-medium mr-2"
          @click.stop="removeConfirm = true"
        >
          <v-icon icon="fa-solid fa-trash" size="small" class="mr-2"></v-icon>
          Delete
        </v-btn>
      </template>
    </PageHeader>
    <!-- Delete confirmation dialog -->
    <v-dialog v-model="removeConfirm" max-width="440">
      <v-card :class="config.vuetify.theme.rounded" class="pa-4">
        <v-card-title class="text-title-large font-weight-medium">Delete this user?</v-card-title>
        <v-card-text class="text-body-medium">
          Are you sure you want to delete this user? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" class="text-none text-body-medium" @click="removeConfirm = false">Cancel</v-btn>
          <v-btn color="error" variant="flat" :class="config.vuetify.theme.rounded" class="text-none text-body-medium" @click="remove">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- Profile form -->
    <v-row class="pa-2">
      <v-col cols="12">
        <v-card color="surface" :flat="config.vuetify.theme.flat" :class="config.vuetify.theme.rounded" class="pa-6">
          <accountUserProfileComponent :user="user" @save="update" @avatar-uploaded="onAvatarUploaded" />
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { useAdminStore } from '../stores/admin.store';
import PageHeader from '../../core/components/core.pageHeader.component.vue';
import accountUserProfileComponent from '../../users/components/user.profile.component.vue';

export default {
  name: 'AdminUserView',
  components: {
    PageHeader,
    accountUserProfileComponent,
  },
  data() {
    return {
      removeConfirm: false,
    };
  },
  computed: {
    id() {
      return this.$route.params.id || null;
    },
    user() {
      const adminStore = useAdminStore();
      return adminStore.user;
    },
  },
  watch: {
    id: {
      immediate: true,
      async handler() {
        await this.loadUser();
      },
    },
  },
  methods: {
    async loadUser() {
      const adminStore = useAdminStore();
      adminStore.resetUser();
      if (this.id) {
        try {
          await adminStore.getUser({ id: this.id });
        } catch (err) {
          console.log(err);
        }
      }
    },
    async update(formData) {
      const adminStore = useAdminStore();
      try {
        await adminStore.updateUser({ id: this.id }, formData);
      } catch (err) {
        console.log(err);
      }
    },
    async onAvatarUploaded() {
      const adminStore = useAdminStore();
      if (this.id) await adminStore.getUser({ id: this.id });
    },
    async remove() {
      const adminStore = useAdminStore();
      try {
        await adminStore.deleteUser({ id: this.id });
        this.$router.push('/admin');
      } catch (err) {
        console.log(err);
      }
    },
  },
};
</script>
