<template>
  <v-container fluid>
    <!-- Header -->
    <v-row class="mx-2 my-1">
      <v-icon class="ma-2" icon="fa-solid fa-user"></v-icon>
      <h2 class="my-1 text-capitalize">{{ firstName }} {{ lastName }}</h2>
      <v-spacer></v-spacer>
      <v-btn v-if="id" class="mx-1" color="error" :flat="config.vuetify.theme.flat" icon @click.stop="removeConfirm = true">
        <v-icon icon="fa-solid fa-trash"></v-icon>
      </v-btn>
      <v-dialog v-model="removeConfirm" max-width="500">
        <v-card>
          <v-card-title class="headline">Delete this item ?</v-card-title>
          <v-card-text> Are you sure you want to delete this item ? we will not be able to recover it. </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="green darken-1" text @click="removeConfirm = false"> Close </v-btn>
            <v-btn color="red darken-1" text @click="remove"> Delete </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
      <v-btn v-if="id" class="mx-1" color="success" :flat="config.vuetify.theme.flat" :disabled="!save" icon @click="update()">
        <v-icon icon="fa-solid fa-save"></v-icon>
      </v-btn>
    </v-row>
    <!-- Form -->
    <v-row class="pa-2">
      <v-col cols="12" sm="12" md="12" lg="12" xl="12">
        <v-card width="100%" class="px-10 pa-6" :style="{ background: theme.current.colors.surface }" :flat="config.vuetify.theme.flat">
          <v-form ref="form" v-model="valid">
            <v-row>
              <v-col cols="12" xs="12" sm="12" md="8" lg="9" xl="10">
                <v-text-field v-model="firstName" label="FirstName" required></v-text-field>
                <v-text-field v-model="lastName" label="LastName" required></v-text-field>
                <v-text-field v-model="email" label="Email" required></v-text-field>
              </v-col>
              <v-col cols="12" xs="12" sm="12" md="4" lg="3" xl="2" align="center">
                <userAvatarComponent :user="user" :width="'200px'" :height="'200px'" :radius="'50%'" :border="'0px'" :color="'#000'" :size="512" />
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12">
                <v-textarea v-model="bio" :rules="rules.bio" label="Bio" auto-grow clearable counter></v-textarea>
                <v-text-field v-model="position" label="Position" required></v-text-field>
                <v-select v-model="roles" :items="rolesItems" attach chips label="Users" multiple required></v-select>
              </v-col>
            </v-row>
          </v-form>
          <!-- <v-row >
              <v-col cols="12">
                <h4 color="gray">Images</h4>
                <v-divider></v-divider>
              </v-col>
              <v-col cols="12" sm="10" md="10" lg="10">
                <v-file-input
                  v-model="file.avatar"
                  accept="image/jpeg"
                  chips
                  show-size
                  prepend-icon="fa-camera"
                  label="Set New Banner"
                ></v-file-input>
              </v-col>
              <v-col cols="12" sm="2" md="2" lg="2">
                <v-btn color="primary" @click="uploadAvatar" :disabled="file.avatar ? false : true"
                  >Upload</v-btn
                >
              </v-col>
            </v-row> -->
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
        await usersStore.getUser(this, { id: this.id });
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
          await usersStore.updateUser(this, { id: this.id });
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
          await usersStore.deleteUser(this, { id: this.id });
          this.$router.push('/users');
        } catch (err) {
          console.log(err);
        }
      }
    },
    // uploadAvatar() {
    //   if (this.file.avatar) {
    //     const usersStore = useUsersStore();
    //     try {
    //       await usersStore.uploadAvatar(this, { id: this.user.id, file: this.file.avatar });
    //       this.$router.push(`/users/${this.user.id}`);
    //     } catch (err) {
    //       console.log(err);
    //     }
    //   }
    // },
  },
};
</script>
