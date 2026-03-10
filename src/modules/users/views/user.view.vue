<template>
  <v-container fluid>
    <!-- Header -->
    <v-row class="mx-2 my-4" align="center">
      <v-icon class="ma-2" icon="fa-solid fa-user" size="small"></v-icon>
      <div>
        <h2 class="text-headline-small font-weight-bold text-capitalize">{{ firstName }} {{ lastName }}</h2>
        <span v-if="lastLoginAt" class="text-body-small text-medium-emphasis">Last login: {{ lastLoginFormatted }}</span>
      </div>
      <v-spacer></v-spacer>
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
      <v-dialog v-model="removeConfirm" max-width="440">
        <v-card :class="config.vuetify.theme.rounded" class="pa-4">
          <v-card-title class="text-title-large font-weight-medium">Delete this item?</v-card-title>
          <v-card-text class="text-body-medium">
            Are you sure you want to delete this item? This action cannot be undone.
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn variant="text" class="text-none text-body-medium" @click="removeConfirm = false">Cancel</v-btn>
            <v-btn color="error" variant="flat" :class="config.vuetify.theme.rounded" class="text-none text-body-medium" @click="remove">Delete</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
      <v-btn
        v-if="id"
        color="primary"
        variant="flat"
        :class="config.vuetify.theme.rounded"
        class="text-none text-body-medium"
        :disabled="!save"
        @click="update()"
      >
        <v-icon icon="fa-solid fa-save" size="small" class="mr-2"></v-icon>
        Save
      </v-btn>
    </v-row>
    <!-- Form -->
    <v-row class="pa-2">
      <v-col cols="12">
        <v-card width="100%" class="pa-6" color="surface" :flat="config.vuetify.theme.flat" :class="config.vuetify.theme.rounded">
          <v-form ref="form" v-model="valid">
            <v-row>
              <v-col cols="12" md="8" lg="9" xl="10">
                <v-text-field v-model="firstName" label="First Name" variant="outlined" density="comfortable" required></v-text-field>
                <v-text-field v-model="lastName" label="Last Name" variant="outlined" density="comfortable" required></v-text-field>
                <v-text-field v-model="email" label="Email" variant="outlined" density="comfortable" required></v-text-field>
              </v-col>
              <v-col cols="12" md="4" lg="3" xl="2" class="d-flex justify-center align-start">
                <userAvatarComponent :user="user" :width="'200px'" :height="'200px'" :radius="'50%'" :border="'0px'" :color="'#000'" :size="512" />
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12">
                <v-textarea v-model="bio" :rules="rules.bio" label="Bio" variant="outlined" density="comfortable" auto-grow clearable counter></v-textarea>
                <v-text-field v-model="position" label="Position" variant="outlined" density="comfortable" required></v-text-field>
                <v-select v-model="roles" :items="rolesItems" chips label="Roles" variant="outlined" density="comfortable" multiple required></v-select>
              </v-col>
            </v-row>
          </v-form>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
/**
 * Module dependencies.
 */
import { cloneDeep } from 'lodash-es';
import { useTheme } from 'vuetify';
import { useAuthStore } from '../../auth/stores/auth.store';
import { useUsersStore } from '../stores/users.store';
import userAvatarComponent from '../components/user.avatar.component.vue';

/**
 * Component definition.
 */
export default {
  components: {
    userAvatarComponent,
  },
  data() {
    const theme = useTheme();
    return {
      theme,
      // vue
      id: this.$route.params.id ? this.$route.params.id : null,
      save: false,
      valid: false,
      // file: {
      //   avatar: null,
      // },
      rules: {
        bio: [(v) => !v || (v && v.length <= 200) || 'Max 200 characters'],
      },
      userRoles: [],
      rolesItems: this.config.whitelists.users.roles,
      removeConfirm: false,
    };
  },
  computed: {
    themeName() {
      return this.theme.name;
    },
    user() {
      const usersStore = useUsersStore();
      return usersStore.user;
    },
    result() {
      const usersStore = useUsersStore();
      return usersStore.result;
    },
    isLoggedIn() {
      const authStore = useAuthStore();
      return authStore.isLoggedIn;
    },
    /**
     * @desc Last login timestamp from auth store user or localStorage fallback.
     * @returns {string|null} ISO date string or null when unavailable.
     */
    lastLoginAt() {
      const authStore = useAuthStore();
      return authStore.user?.lastLoginAt || localStorage.getItem(`${this.config.cookie.prefix}LastLoginAt`) || null;
    },
    /**
     * @desc Human-readable relative time since the last login.
     * @returns {string} Formatted string such as "2 hours ago".
     */
    lastLoginFormatted() {
      if (!this.lastLoginAt) return '';
      return this.dayjs(this.lastLoginAt).fromNow();
    },
    firstName: {
      get() {
        return this.user.firstName;
      },
      set(firstName) {
        const usersStore = useUsersStore();
        usersStore.user.firstName = firstName;
      },
    },
    lastName: {
      get() {
        return this.user.lastName;
      },
      set(lastName) {
        const usersStore = useUsersStore();
        usersStore.user.lastName = lastName;
      },
    },
    email: {
      get() {
        return this.user.email;
      },
      set(email) {
        const usersStore = useUsersStore();
        usersStore.user.email = email;
      },
    },
    bio: {
      get() {
        return this.user.bio;
      },
      set(bio) {
        const usersStore = useUsersStore();
        usersStore.user.bio = bio;
      },
    },
    position: {
      get() {
        return this.user.position;
      },
      set(position) {
        const usersStore = useUsersStore();
        usersStore.user.position = position;
      },
    },
    roles: {
      get() {
        return this.userRoles;
      },
      set(roles) {
        this.userRoles = roles;
        this.save = true;
        const usersStore = useUsersStore();
        usersStore.user.roles = cloneDeep(this.userRoles);
      },
    },
    avatar: {
      get() {
        return this.user.avatar;
      },
      set(avatar) {
        const usersStore = useUsersStore();
        usersStore.user.avatar = avatar;
      },
    },
  },
  watch: {
    user: {
      handler() {
        this.save = true;
      },
      deep: true,
    },
  },
  async created() {
    const usersStore = useUsersStore();
    if (this.id) {
      usersStore.resetUser();
      try {
        await usersStore.getUser({ id: this.id });
        this.userRoles = cloneDeep(this.user.roles);
        this.save = false;
      } catch (err) {
        console.log(err);
      }
    } else {
      usersStore.resetUser();
    }
  },
  methods: {
    async update() {
      const form = await this.$refs.form.validate();
      if (form.valid) {
        const usersStore = useUsersStore();
        usersStore.user.roles = this.roles;

        try {
          await usersStore.updateUser({ id: this.id });
          this.save = false;
        } catch (err) {
          console.log(err);
        }
      }
    },
    async remove() {
      const form = await this.$refs.form.validate();
      if (form.valid) {
        const usersStore = useUsersStore();
        try {
          await usersStore.deleteUser({ id: this.id });
          this.$router.push('/users');
        } catch (err) {
          console.log(err);
        }
      }
    },
  },
};
</script>
