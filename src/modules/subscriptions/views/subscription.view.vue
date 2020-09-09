<template>
  <v-container fluid>
    <!-- Header -->
    <v-row class="mt-3 mx-3">
      <v-subheader>
        <v-icon class="mr-5">fa-subscription</v-icon>
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
                <v-col cols="12" xs="12" sm="12" md="9" lg="10" xl="11">
                  <v-text-field v-model="email" label="Email" required></v-text-field>
                  <v-switch v-model="news" label="News" required></v-switch>
                </v-col>
                <v-col cols="12" xs="12" sm="12" md="3" lg="2" xl="1">
                  <center>
                    <userArrayComponent
                      :user="subscription"
                      :width="'125px'"
                      :height="'125px'"
                      :radius="'50%'"
                      :border="'0px'"
                      :color="'#000'"
                    />
                  </center>
                </v-col>
              </v-row>
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
import userArrayComponent from '../../users/components/user.avatar.component.vue';

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
      rolesItems: ['admin', 'subscription'],
      removeConfirm: false,
    };
  },
  components: {
    userArrayComponent,
  },
  computed: {
    ...mapGetters(['theme', 'subscription', 'result']),
    email: {
      get() {
        return this.subscription.email;
      },
      set(email) {
        this.save = true;
        this.$store.commit('subscription_update', { email });
      },
    },
    news: {
      get() {
        return this.subscription.news;
      },
      set(news) {
        this.save = true;
        this.$store.commit('subscription_update', { news });
      },
    },
  },
  methods: {
    update() {
      if (this.$refs.form.validate()) {
        const { email } = this;
        const { news } = this;

        const data = {
          id: this.id,
          email,
          news,
        };

        this.$store
          .dispatch('updateSubscription', data)
          .then(() => {
            this.save = false;
          })
          .catch((err) => console.log(err));
      }
    },
    remove() {
      if (this.$refs.form.validate()) {
        this.$store
          .dispatch('deleteSubscription', { id: this.id })
          .then(() => {
            this.$router.push('/subscriptions');
          })
          .catch((err) => console.log(err));
      }
    },
  },
  created() {
    if (this.id) {
      this.$store.commit('subscription_reset');
      this.$store.dispatch('getSubscription', this.id).catch((err) => console.log(err));
    } else {
      this.$store.commit('subscription_reset');
    }
  },
};
</script>
