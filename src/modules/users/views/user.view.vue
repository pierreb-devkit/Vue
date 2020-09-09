<template>
  <v-container fluid>
    <!-- Header -->
    <v-row class="mt-3 mx-3">
      <v-subheader>
        <v-icon class="mr-5">fa-user</v-icon>
        <b>{{ firstName }} {{ lastName }}</b>
      </v-subheader>
      <div class="flex-grow-1"></div>
      <v-btn v-if="id" color="red lighten-3" @click.stop="removeConfirm = true" icon>
        <v-icon>fa-trash</v-icon>
      </v-btn>
      <v-dialog v-model="removeConfirm" max-width="290">
        <v-card>
          <v-card-title class="headline">Delete this item ?</v-card-title>
          <v-card-text>
            Are you sure you want to delete this item ? we will not be able to recover it.
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="green darken-1" text @click="removeConfirm = false">
              Close
            </v-btn>
            <v-btn color="red darken-1" text @click="remove">
              Delete
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
      <v-btn v-if="id" class="mr-5" color="blue lighten-2" @click="update()" :disabled="!save" icon>
        <v-icon>fa-save</v-icon>
      </v-btn>
    </v-row>
    <!-- First Form -->
    <v-row class="mx-3">
      <v-col cols="12" sm="12" md="12" lg="12" xl="12">
        <v-row align="start" justify="center">
          <v-card
            outlined
            tile
            width="100%"
            class="px-10 pa-6"
            :style="{ background: config.vuetify.theme.themes[theme].surface }"
            :flat="config.vuetify.theme.flat"
          >
            <v-form ref="form" v-model="valid">
              <v-row>
                <v-col cols="12" xs="12" sm="12" md="8" lg="9" xl="10">
                  <v-text-field v-model="firstName" label="FirstName" required></v-text-field>
                  <v-text-field v-model="lastName" label="LastName" required></v-text-field>
                  <v-text-field v-model="email" label="Email" required></v-text-field>
                </v-col>
                <v-col cols="12" xs="12" sm="12" md="4" lg="3" xl="2">
                  <center>
                    <userArrayComponent
                      :user="user"
                      :width="'200px'"
                      :height="'200px'"
                      :radius="'50%'"
                      :border="'0px'"
                      :color="'#000'"
                    />
                  </center>
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="12">
                  <v-textarea
                    v-model="bio"
                    :rules="rules.bio"
                    label="Bio"
                    auto-grow
                    clearable
                    counter
                  ></v-textarea>
                  <v-select
                    v-model="roles"
                    :items="rolesItems"
                    attach
                    chips
                    label="Users"
                    multiple
                    required
                  ></v-select>
                </v-col>
              </v-row>
              <!-- <v-row>
                <v-col cols="12">
                  <h4 color="gray">Avatar</h4>
                  <v-divider></v-divider>
                </v-col>
                <v-col cols="12" sm="12" md="6" lg="5">
                  <v-text-field v-model="avatar" label="Banner" required></v-text-field>
                </v-col>
                <v-col cols="12" sm="12" md="6" lg="5">
                  <v-file-input
                    v-model="avatar"
                    accept="image/jpeg"
                    chips
                    show-size
                    prepend-icon="fa-camera"
                    label="Set New Banner"
                  ></v-file-input>
                </v-col>
                <v-col cols="12" sm="12" md="2" lg="2">
                  <v-btn color="primary" @click="uploadAvatar" :disabled="file ? false : true"
                    >Upload</v-btn
                  >
                </v-col>
              </v-row> -->
              <v-row v-if="!id">
                <v-btn :disabled="!valid" color="success" class="mr-4" @click="create"
                  >Validate</v-btn
                >
              </v-row>
            </v-form>
          </v-card>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
/**
 * Module dependencies.
 */
import { mapGetters } from 'vuex';
import userArrayComponent from '../components/user.avatar.component.vue';

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
      rules: {
        bio: [(v) => !v || (v && v.length <= 200) || 'Max 200 characters'],
      },
      rolesItems: ['admin', 'user'],
      removeConfirm: false,
    };
  },
  components: {
    userArrayComponent,
  },
  computed: {
    ...mapGetters(['theme', 'user', 'result']),
    firstName: {
      get() {
        return this.user.firstName;
      },
      set(firstName) {
        this.save = true;
        this.$store.commit('user_update', { firstName });
      },
    },
    lastName: {
      get() {
        return this.user.lastName;
      },
      set(lastName) {
        this.save = true;
        this.$store.commit('user_update', { lastName });
      },
    },
    email: {
      get() {
        return this.user.email;
      },
      set(email) {
        this.save = true;
        this.$store.commit('user_update', { email });
      },
    },
    bio: {
      get() {
        return this.user.bio;
      },
      set(bio) {
        this.save = true;
        this.$store.commit('user_update', { bio });
      },
    },
    roles: {
      get() {
        return this.user.roles;
      },
      set(roles) {
        this.save = true;
        this.$store.commit('user_update', { roles });
      },
    },
    avatar: {
      get() {
        return this.user.avatar;
      },
      set(avatar) {
        this.save = true;
        this.$store.commit('user_update', { avatar });
      },
    },
  },
  methods: {
    update() {
      if (this.$refs.form.validate()) {
        const { firstName } = this;
        const { lastName } = this;
        const { email } = this;
        const { bio } = this;
        const { roles } = this;
        const { avatar } = this;

        const data = {
          id: this.id,
          firstName,
          lastName,
          email,
          bio,
          roles,
          avatar,
        };

        this.$store
          .dispatch('updateUser', data)
          .then(() => {
            this.save = false;
          })
          .catch((err) => console.log(err));
      }
    },
    remove() {
      if (this.$refs.form.validate()) {
        this.$store
          .dispatch('deleteUser', { id: this.id })
          .then(() => {
            this.$router.push('/users');
          })
          .catch((err) => console.log(err));
      }
    },
  },
  created() {
    if (this.id) {
      this.$store.commit('user_reset');
      this.$store.dispatch('getUser', this.id).catch((err) => console.log(err));
    } else {
      this.$store.commit('user_reset');
    }
  },
};
</script>
