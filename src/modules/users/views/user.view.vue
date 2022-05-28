<template>
  <v-container fluid>
    <!-- Header -->
    <v-row class="mx-2 my-1">
      <v-icon class="ma-2" icon="fa-solid fa-user"></v-icon>
      <h2 class="my-1 text-capitalize">{{ firstName }} {{ lastName }}</h2>
      <v-spacer></v-spacer>
      <v-btn v-if="id" class="mx-1" color="error" @click.stop="removeConfirm = true" :flat="config.vuetify.theme.flat" icon>
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
      <v-btn v-if="id" class="mx-1" color="success" @click="update()" :flat="config.vuetify.theme.flat" :disabled="!save" icon>
        <v-icon icon="fa-solid fa-save"></v-icon>
      </v-btn>
    </v-row>
    <!-- Form -->
    <v-row class="pa-2">
      <v-col cols="12" sm="12" md="12" lg="12" xl="12">
        <v-card
          width="100%"
          class="px-10 pa-6"
          :style="{ background: config.vuetify.theme.themes[theme].colors.surface }"
          :flat="config.vuetify.theme.flat"
        >
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
import _ from 'lodash';
import { mapGetters } from 'vuex';
import userAvatarComponent from '../components/user.avatar.component.vue';

/**
 * Export default
 */
export default {
  data() {
    return {
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
  components: {
    userAvatarComponent,
  },
  computed: {
    ...mapGetters(['theme', 'user', 'result', 'isLoggedIn']),
    firstName: {
      get() {
        return this.user.firstName;
      },
      set(firstName) {
        this.$store.commit('user_update', { firstName });
      },
    },
    lastName: {
      get() {
        return this.user.lastName;
      },
      set(lastName) {
        this.$store.commit('user_update', { lastName });
      },
    },
    email: {
      get() {
        return this.user.email;
      },
      set(email) {
        this.$store.commit('user_update', { email });
      },
    },
    bio: {
      get() {
        return this.user.bio;
      },
      set(bio) {
        this.$store.commit('user_update', { bio });
      },
    },
    position: {
      get() {
        return this.user.position;
      },
      set(position) {
        this.$store.commit('user_update', { position });
      },
    },
    roles: {
      get() {
        return this.userRoles;
      },
      set(roles) {
        this.userRoles = roles;
        this.save = true;
        this.$store.commit('user_update', { roles: _.cloneDeep(this.userRoles) });
      },
    },
    avatar: {
      get() {
        return this.user.avatar;
      },
      set(avatar) {
        this.$store.commit('user_update', { avatar });
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
  methods: {
    async update() {
      const form = await this.$refs.form.validate();
      if (form.valid) {
        await this.$store.commit('user_update', { roles: this.roles });

        this.$store
          .dispatch('updateUser', { id: this.id })
          .then(() => {
            this.save = false;
          })
          .catch((err) => console.log(err));
      }
    },
    async remove() {
      const form = await this.$refs.form.validate();
      if (form.valid) {
        this.$store
          .dispatch('deleteUser', { id: this.id })
          .then(() => {
            this.$router.push('/users');
          })
          .catch((err) => console.log(err));
      }
    },
    // uploadAvatar() {
    //   if (this.file.avatar) {
    //     this.$store
    //       .dispatch('uploadAvatar', { id: this.user.id, file: this.file.avatar })
    //       .then(() => {
    //         this.$router.push(`/users/${this.sample.id}`);
    //       })
    //       .catch((err) => console.log(err));
    //   }
    // },
  },
  created() {
    if (this.id) {
      this.$store.commit('user_reset');
      this.$store
        .dispatch('getUser', { id: this.id })
        .then(() => {
          this.userRoles = _.cloneDeep(this.user.roles);
          this.save = false;
        })
        .catch((err) => console.log(err));
    } else {
      this.$store.commit('user_reset');
    }
  },
};
</script>
