<template>
  <v-form ref="form" v-model="valid">
    <v-row>
      <v-col cols="12" md="8" lg="9">
        <v-row>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="form.firstName"
              label="First Name"
              placeholder="John"
              variant="outlined"
              density="comfortable"
              hide-details="auto"
              class="mb-4"
            ></v-text-field>
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="form.lastName"
              label="Last Name"
              placeholder="Doe"
              variant="outlined"
              density="comfortable"
              hide-details="auto"
              class="mb-4"
            ></v-text-field>
          </v-col>
        </v-row>
        <v-text-field
          v-model="form.email"
          label="Email"
          variant="outlined"
          density="comfortable"
          disabled
          hide-details="auto"
          class="mb-4"
        ></v-text-field>
        <v-text-field
          v-model="form.position"
          label="Position"
          placeholder="Software Engineer"
          variant="outlined"
          density="comfortable"
          hide-details="auto"
          class="mb-4"
        ></v-text-field>
        <v-textarea
          v-model="form.bio"
          label="Bio"
          :rules="rules.bio"
          placeholder="Tell us about yourself..."
          variant="outlined"
          density="comfortable"
          rows="3"
          auto-grow
          clearable
          counter
          hide-details="auto"
          class="mb-6"
        ></v-textarea>
      </v-col>
      <v-col cols="12" md="4" lg="3" xl="2" class="d-flex flex-column align-center">
        <coreAvatarUploader :user="user" :size="200" @uploaded="$emit('avatar-uploaded')" />
      </v-col>
    </v-row>
    <v-btn
      color="primary"
      variant="flat"
      :class="config.vuetify.theme.rounded"
      class="text-none text-body-medium"
      :disabled="!dirty"
      @click="save"
    >
      Save Changes
    </v-btn>
  </v-form>
</template>

<script>
import coreAvatarUploader from '../../core/components/core.avatarUploader.component.vue';

export default {
  name: 'UserProfileComponent',
  components: {
    coreAvatarUploader,
  },
  props: {
    user: { type: Object, required: true },
    organizations: { type: Array, default: () => [] },
  },
  emits: ['save', 'avatar-uploaded'],
  data() {
    return {
      valid: false,
      dirty: false,
      form: {
        firstName: '',
        lastName: '',
        email: '',
        bio: '',
        position: '',
      },
      orgItems: [],
      rules: {
        bio: [(v) => !v || v.length <= 200 || 'Max 200 characters'],
      },
    };
  },
  watch: {
    user: {
      handler(u) {
        if (u) {
          this.syncForm(u);
          this.syncOrganizations();
        }
      },
      immediate: true,
    },
    organizations: {
      handler() {
        this.syncOrganizations();
      },
    },
    form: {
      handler() { this.dirty = true; },
      deep: true,
    },
  },
  methods: {
    /**
     * @desc Pull the form fields from a fresh `user` prop and reset dirty.
     * @param {object} u - The user record.
     */
    syncForm(u) {
      this.form.firstName = u.firstName || '';
      this.form.lastName = u.lastName || '';
      this.form.email = u.email || '';
      this.form.bio = u.bio || '';
      this.form.position = u.position || '';
      this.$nextTick(() => { this.dirty = false; });
    },
    /**
     * @desc Build the `orgItems` list from `user.memberships` (preferred) or
     *       the `organizations` prop (legacy flat format).
     */
    syncOrganizations() {
      const memberships = this.getMemberships();
      this.orgItems = memberships.map((m) => ({
        title: `${m.orgName} (${m.role})`,
        value: m.id,
        role: m.role,
        orgName: m.orgName,
        orgId: m.orgId,
      }));
    },
    /**
     * @desc Normalize the user's memberships into a flat shape.
     * @returns {Array<{ id: string, orgId: string, orgName: string, role: string }>}
     */
    getMemberships() {
      if (this.user.memberships && this.user.memberships.length) {
        return this.user.memberships.map((m) => ({
          id: String(m._id || m.id),
          orgId: String(m.organizationId?._id || m.organizationId?.id || m.organizationId || ''),
          orgName: (m.organizationId && m.organizationId.name) || '—',
          role: m.role || '—',
        }));
      }
      if (this.organizations && this.organizations.length) {
        return this.organizations.map((org) => ({
          id: String(org._id || org.id),
          orgId: String(org._id || org.id),
          orgName: org.name || '—',
          role: org.role || '—',
        }));
      }
      return [];
    },
    isActiveOrg(org) {
      const currentOrg = this.user?.currentOrganization?._id || this.user?.currentOrganization?.id || this.user?.currentOrganization;
      return currentOrg && org.orgId && String(currentOrg) === String(org.orgId);
    },
    /**
     * @desc Emit the form payload on user save (after Vuetify form validation).
     * @returns {Promise<void>}
     */
    async save() {
      const result = await this.$refs.form.validate();
      if (result.valid) {
        this.$emit('save', { ...this.form });
        this.dirty = false;
      }
    },
  },
};
</script>
