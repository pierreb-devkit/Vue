<template>
  <v-container fluid>
    <v-layout class="ma-3" wrap align-content-space-around text-xs-center>
      <v-card
        outlined
        tile
        width="100%"
        :style="{ background: config.vuetify.theme.themes[theme].surface }"
        :flat="config.vuetify.theme.flat"
      >
        <v-card-title>
          Users
          <v-spacer></v-spacer>
          <v-text-field v-model="search" label="Search" single-line hide-details></v-text-field>
        </v-card-title>
        <v-data-table
          :headers="headers"
          :items="users"
          :sort-by="['createdAt']"
          :sort-desc="[true]"
          :search="search"
          :options.sync="options"
          :loading="loading"
          :server-items-length="totalCount"
          :footer-props="{
            'items-per-page-options': perPage,
          }"
          :style="{ background: config.vuetify.theme.themes[theme].surface }"
          :flat="config.vuetify.theme.flat"
        >
          <template v-slot:[`item.avatar`]="{ item }">
            <userAvatarComponent
              :user="item"
              :width="'37px'"
              :height="'37px'"
              :radius="'50%'"
              :border="'0px'"
              :color="'#000'"
            />
          </template>
          <template v-slot:[`item.email`]="{ item }"
            ><a :href="`mailto:${item.email}`">{{ item.email }}</a></template
          >
          <template v-slot:[`item.createdAt`]="{ item }"
            >{{ moment(new Date(item.createdAt)).format('DD/MM/YY à HH:mm') }}
          </template>
          <template v-slot:[`item.updatedAt`]="{ item }"
            >{{ moment(new Date(item.createdAt)).format('DD/MM/YY à HH:mm') }}
          </template>
          <template v-slot:[`item.id`]="{ item }">
            <v-btn v-if="item.id" :to="`/users/${item.id}`" icon>
              <v-icon>fa-eye</v-icon>
            </v-btn>
          </template>
        </v-data-table>
      </v-card>
      <v-row v-if="!users.length" align="start" justify="center">
        <v-col cols="12">
          <v-card
            class="mx-3 pa-8"
            outlined
            tile
            :style="{ background: config.vuetify.theme.themes[theme].surface }"
            :flat="config.vuetify.theme.flat"
          >
            <h2 class="text-center">No Users found :( !</h2>
          </v-card>
        </v-col>
      </v-row>
    </v-layout>
  </v-container>
</template>

<script>
/**
 * Module dependencies.
 */
import { mapGetters } from 'vuex';
import tools from '@/lib/helpers/tools';
import userAvatarComponent from '../components/user.avatar.component.vue';

/**
 * Export default
 */
export default {
  data: () => ({
    search: '',
    loading: true,
    totalCount: 40,
    perPage: [20, 50, 100],
    options: {},
    headers: [
      { text: 'Avatar', value: 'avatar' },
      { text: 'FirstName', value: 'firstName' },
      { text: 'LastName', value: 'lastName' },
      { text: 'Email', value: 'email' },
      { text: 'roles', value: 'roles' },
      { text: 'updatedAt', value: 'updatedAt' },
      { text: 'createdAt', value: 'createdAt' },
      { text: 'View', value: 'id' },
    ],
  }),
  components: {
    userAvatarComponent,
  },
  computed: {
    ...mapGetters(['theme', 'isLoggedIn', 'users']),
  },
  watch: {
    options(options) {
      this.loading = true;
      this.$store
        .dispatch('getUsers', tools.pageRequest(options.page, options.itemsPerPage, this.search))
        .then(() => {
          this.totalCount = tools.serverItemsLength(this.users, this.options);
          this.loading = false;
        });
    },
  },
  methods: {
    getSearch() {
      this.loading = true;
      this.$store
        .dispatch('getUsers', tools.pageRequest(1, this.options.itemsPerPage, this.search))
        .then(() => {
          this.totalCount = tools.serverItemsLength(this.users, this.options);
          this.loading = false;
        });
    },
  },
  created() {
    this.watchSearch = this.$watch(
      'search',
      this._.debounce(() => {
        this.getSearch();
      }, 1000),
    );
  },
  beforeDestroy() {
    this.watchSearch();
  },
};
</script>
