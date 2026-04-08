<template>
  <div>
    <v-form ref="form" v-model="valid">
      <v-row>
        <v-col cols="12" md="8" lg="9">
          <v-row>
            <v-col cols="12" sm="6">
              <label class="text-label-large font-weight-medium d-block mb-1">First Name</label>
              <v-text-field v-model="form.firstName" placeholder="John" variant="outlined" density="comfortable" hide-details="auto" class="mb-4"></v-text-field>
            </v-col>
            <v-col cols="12" sm="6">
              <label class="text-label-large font-weight-medium d-block mb-1">Last Name</label>
              <v-text-field v-model="form.lastName" placeholder="Doe" variant="outlined" density="comfortable" hide-details="auto" class="mb-4"></v-text-field>
            </v-col>
          </v-row>
          <label class="text-label-large font-weight-medium d-block mb-1">Email</label>
          <v-text-field v-model="form.email" variant="outlined" density="comfortable" disabled hide-details="auto" class="mb-4"></v-text-field>
          <label class="text-label-large font-weight-medium d-block mb-1">Position</label>
          <v-text-field v-model="form.position" placeholder="Software Engineer" variant="outlined" density="comfortable" hide-details="auto" class="mb-4"></v-text-field>
          <label class="text-label-large font-weight-medium d-block mb-1">Bio</label>
          <v-textarea v-model="form.bio" :rules="rules.bio" placeholder="Tell us about yourself..." variant="outlined" density="comfortable" rows="3" auto-grow clearable counter hide-details="auto" class="mb-6"></v-textarea>
        </v-col>
        <v-col cols="12" md="4" lg="3" xl="2" class="d-flex flex-column align-center">
          <div class="position-relative" style="cursor: pointer;" @click="triggerUpload()">
            <userAvatarComponent :user="user" width="200px" height="200px" radius="50%" border="0px" color="#000" :size="512" :disabled="true" />
            <div
              class="position-absolute d-flex align-center justify-center"
              :style="{ bottom: '8px', right: '8px', width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(var(--v-theme-primary), 1)', cursor: 'pointer' }"
            >
              <v-icon icon="fa-solid fa-camera" size="small" color="white"></v-icon>
            </div>
          </div>
          <input
            ref="avatarInput"
            type="file"
            accept="image/*"
            style="display: none"
            @change="uploadAvatar"
          />
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
  </div>
</template>

<script>
import axios from '../../../lib/services/axios';
import config from '../../../lib/services/config';
import roleColor from '../../../lib/helpers/roleColor';
import orgColor from '../../../lib/helpers/orgColor';
import userAvatarComponent from '../../core/components/user.avatar.component.vue';

export default {
  name: 'UserProfileComponent',
  components: {
    userAvatarComponent,
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
    syncForm(u) {
      this.form.firstName = u.firstName || '';
      this.form.lastName = u.lastName || '';
      this.form.email = u.email || '';
      this.form.bio = u.bio || '';
      this.form.position = u.position || '';
      this.$nextTick(() => { this.dirty = false; });
    },
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
    getMemberships() {
      // Nested format: [{ organizationId: { name }, role }]
      if (this.user.memberships && this.user.memberships.length) {
        return this.user.memberships.map((m) => ({
          id: String(m._id || m.id),
          orgId: String(m.organizationId?._id || m.organizationId?.id || m.organizationId || ''),
          orgName: (m.organizationId && m.organizationId.name) || '—',
          role: m.role || '—',
        }));
      }
      // Flat format: [{ name, role }]
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
    roleColor,
    orgColor,
    isActiveOrg(org) {
      const currentOrg = this.user?.currentOrganization?._id || this.user?.currentOrganization?.id || this.user?.currentOrganization;
      return currentOrg && org.orgId && String(currentOrg) === String(org.orgId);
    },
    async save() {
      const result = await this.$refs.form.validate();
      if (result.valid) {
        this.$emit('save', { ...this.form });
        this.dirty = false;
      }
    },
    triggerUpload() {
      this.$refs.avatarInput.click();
    },
    async uploadAvatar(event) {
      const file = event.target.files[0];
      if (!file) return;
      const formData = new FormData();
      formData.append('avatar', file);
      const api = `${config.api.protocol}://${config.api.host}:${config.api.port}/${config.api.base}`;
      try {
        await axios.post(`${api}/users/avatar`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        this.$emit('avatar-uploaded');
      } catch (err) {
        console.error(err);
      } finally {
        event.target.value = '';
      }
    },
  },
};
</script>
