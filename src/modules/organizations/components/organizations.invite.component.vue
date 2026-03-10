<template>
  <v-card
    color="surface"
    :flat="config.vuetify.theme.flat"
    :class="config.vuetify.theme.rounded"
    class="pa-6"
  >
    <h3 class="text-title-medium font-weight-medium mb-4">Invite Member</h3>
    <v-form ref="form" v-model="valid" @submit.prevent="invite">
      <v-row dense align="end">
        <v-col cols="12" sm="5">
          <v-text-field
            v-model="email"
            label="Email Address"
            :rules="[rules.required, rules.email]"
            variant="outlined"
            density="comfortable"
            type="email"
            placeholder="colleague@company.com"
          ></v-text-field>
        </v-col>
        <v-col cols="12" sm="4">
          <v-select
            v-model="role"
            label="Role"
            :items="roles"
            variant="outlined"
            density="comfortable"
          ></v-select>
        </v-col>
        <v-col cols="12" sm="3">
          <v-btn
            :disabled="!valid || loading"
            :loading="loading"
            color="primary"
            variant="flat"
            :class="config.vuetify.theme.rounded"
            class="text-none text-body-medium"
            block
            @click="invite"
          >
            <v-icon icon="fa-solid fa-paper-plane" size="small" class="mr-2"></v-icon>
            Invite
          </v-btn>
        </v-col>
      </v-row>
    </v-form>

    <!-- Feedback -->
    <v-alert
      v-if="feedback.show"
      :type="feedback.type"
      variant="tonal"
      closable
      class="mt-3"
      density="compact"
      @click:close="feedback.show = false"
    >
      {{ feedback.message }}
    </v-alert>
  </v-card>
</template>

<script>
/**
 * Module dependencies.
 */
import { useTheme } from 'vuetify';
import { useOrganizationsStore } from '../stores/organizations.store';

/**
 * Component definition.
 */
export default {
  name: 'OrganizationsInviteComponent',
  props: {
    organizationId: {
      type: String,
      required: true,
    },
  },
  emits: ['invited'],
  data() {
    const theme = useTheme();
    return {
      theme,
      valid: false,
      loading: false,
      email: '',
      role: 'member',
      roles: [
        { title: 'Member', value: 'member' },
        { title: 'Admin', value: 'admin' },
      ],
      rules: {
        required: (v) => !!v || 'Required',
        email: (v) => /.+@.+\..+/.test(v) || 'Must be a valid email',
      },
      feedback: {
        show: false,
        type: 'success',
        message: '',
      },
    };
  },
  computed: {
    themeName() {
      return this.theme.name;
    },
  },
  methods: {
    /**
     * @desc Submit the invite form and send invitation.
     * @returns {Promise<void>}
     */
    async invite() {
      const form = await this.$refs.form.validate();
      if (!form.valid) return;

      this.loading = true;
      this.feedback.show = false;

      const organizationsStore = useOrganizationsStore();
      try {
        const result = await organizationsStore.inviteMember(this.organizationId, {
          email: this.email,
          role: this.role,
        });
        if (result) {
          this.feedback = { show: true, type: 'success', message: `Invitation sent to ${this.email}` };
          this.email = '';
          this.role = 'member';
          this.$refs.form.reset();
          this.$emit('invited');
        } else {
          this.feedback = { show: true, type: 'error', message: 'Failed to send invitation' };
        }
      } catch {
        this.feedback = { show: true, type: 'error', message: 'Failed to send invitation' };
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>
