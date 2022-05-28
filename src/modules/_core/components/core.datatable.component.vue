<template>
  <v-card width="100%" class="datatable" :style="{ background: config.vuetify.theme.themes[theme].colors.surface }" :flat="config.vuetify.theme.flat">
    <v-card-title>
      Users
      <v-spacer></v-spacer>
      <v-text-field v-model="search" label="Search" single-line hide-details></v-text-field>
    </v-card-title>
    <v-progress-linear :active="this.loading" indeterminate color="secondary"></v-progress-linear>
    <v-table v-if="items && items.length > 0" fixed-header>
      <thead>
        <tr>
          <th v-for="header in headers" :key="header.text" class="text-left">{{ header.text }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in items" :key="item._id">
          <td v-for="header in headers" :key="header.text">
            <span v-if="header.value">
              <span v-if="header.kind == 'date' && header.format">
                {{ moment(new Date(item[header.value])).format(header.format) }}
              </span>
              <span v-else-if="header.kind == 'icon'">
                <v-btn v-if="header.path && header.pathValue" :to="`${header.path}${item[header.pathValue]}`" variant="contained-flat" icon>
                  <v-icon :color="header.color" :icon="header.icon"></v-icon>
                </v-btn>
                <v-btn v-else variant="contained-flat" icon>
                  <v-icon :color="header.color" :icon="header.icon"></v-icon>
                </v-btn>
              </span>
              <span v-else-if="header.kind == 'email'">
                <a :href="`mailto:${item[header.value]}`">{{ item[header.value] }}</a>
              </span>
              <span v-else-if="header.kind == 'avatar'">
                <userAvatarComponent :user="item" :width="'37px'" :height="'37px'" :radius="'50%'" :border="'0px'" :color="'#000'" />
              </span>
              <span v-else-if="header.kind == 'capitalize'" class="text-capitalize"> {{ item[header.value] }}</span>
              <span v-else-if="header.kind == 'link' && header.path && header.pathValue">
                <v-btn :to="`${header.path}${item[header.pathValue]}`" :class="`text-${header.color}`" variant="contained-flat">
                  {{ item[header.value] }}
                </v-btn>
              </span>
              <span v-else-if="header.kind == 'tags'">
                <v-chip class="mr-2" v-for="(role, index) in item[header.value]" v-bind:index="index" v-bind:key="index">{{ role }}</v-chip>
              </span>
              <span v-else>{{ item[header.value] }}</span>
            </span>
          </td>
        </tr>
      </tbody>
    </v-table>
    <v-row v-if="!items.length || items.length == 0">
      <v-col cols="12">
        <h2 class="text-center pa-12">No Items found :( !</h2>
      </v-col>
    </v-row>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-select :items="perPage" v-model="options.itemsPerPage" label="Items per page" style="max-width: 150px; width: 150px"></v-select>
      <v-btn @click="switchPage('-')" :disabled="options.page <= 1" variant="contained-flat" class="mb-8" icon>
        <v-icon icon="fa-solid fa-angle-left"></v-icon>
      </v-btn>
      <v-btn variant="contained-flat" disabled class="mb-8">
        {{ options.page }}
      </v-btn>
      <v-btn @click="switchPage('+')" :disabled="items.length < options.itemsPerPage" variant="contained-flat" class="mb-8" icon>
        <v-icon icon="fa-solid fa-angle-right"></v-icon>
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style>
.datatable .v-field__overlay {
  background: none !important;
}
</style>

<script>
/**
 * Module dependencies.
 */
import _ from 'lodash';
import { mapGetters } from 'vuex';
import * as tools from '../../../lib/helpers/tools';
import userAvatarComponent from '../../users/components/user.avatar.component.vue';
/**
 * Export default
 */
export default {
  name: 'core-datatable',
  data: () => ({
    search: '',
    loading: true,
    // totalCount: 10,
    perPage: [5, 50, 100],
    options: {
      page: 1,
      itemsPerPage: 5,
    },
  }),
  props: ['headers', 'items', 'request'],
  computed: {
    ...mapGetters(['theme']),
  },
  components: {
    userAvatarComponent,
  },
  watch: {
    options: {
      handler(options) {
        this.loading = true;
        this.$store.dispatch(this.request, tools.pageRequest(options.page, options.itemsPerPage, this.search)).then(() => {
          // this.totalCount = tools.serverItemsLength(this.items, this.options);
          this.loading = false;
        });
      },
      deep: true,
    },
  },
  methods: {
    getSearch() {
      this.loading = true;
      this.$store.dispatch(this.request, tools.pageRequest(this.options.page, this.options.itemsPerPage, this.search)).then(() => {
        // this.totalCount = tools.serverItemsLength(this.items, this.options);
        this.loading = false;
      });
    },
    switchPage(sign) {
      if (sign === '-' && this.options.page > 1) {
        this.options.page -= 1;
      }
      if (sign === '+' && this.items.length === this.options.itemsPerPage) {
        this.options.page += 1;
      }
    },
  },
  created() {
    this.getSearch();
    this.watchSearch = this.$watch(
      'search',
      _.debounce(() => {
        this.getSearch();
      }, 1000),
    );
  },
  beforeDestroy() {
    this.watchSearch();
  },
};
</script>
