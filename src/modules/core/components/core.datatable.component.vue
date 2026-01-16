<template>
  <v-card width="100%" class="datatable" :style="{ background: theme.current.colors.surface }" :flat="config.vuetify.theme.flat">
    <v-card-title>
      {{ title }}
      <v-spacer></v-spacer>
      <v-text-field v-if="search != null ? search : true" v-model="textSearch" label="Search" single-line hide-details></v-text-field>
    </v-card-title>
    <v-progress-linear :active="loading" indeterminate color="secondary"></v-progress-linear>
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
              <span v-if="header.kind === 'date' && header.format">
                {{ dayjs(new Date(lodash.get(item, header.value))).format(header.format) }}
              </span>
              <span v-else-if="header.kind === 'icon'">
                <v-btn v-if="header.path && header.pathValue" :to="`${header.path}${lodash.get(item, header.pathValue)}`" variant="flat" icon>
                  <v-icon :color="header.color" :icon="header.icon"></v-icon>
                </v-btn>
                <v-btn
                  v-else-if="header.dispatch && header.param"
                  variant="flat"
                  icon
                  @click="dispatch(header.dispatch, header.param, lodash.get(item, header.param), header.refresh)"
                >
                  <v-icon :color="header.color" :icon="header.icon"></v-icon>
                </v-btn>
                <v-btn v-else variant="flat" icon>
                  <v-icon :color="header.color" :icon="header.icon"></v-icon>
                </v-btn>
              </span>
              <span v-else-if="header.kind === 'email'">
                <a :href="`mailto:${lodash.get(item, header.value)}`">{{ lodash.get(item, header.value) }}</a>
              </span>
              <span v-else-if="header.kind === 'avatar'">
                <userAvatarComponent :user="item" :width="'37px'" :height="'37px'" :radius="'50%'" :border="'0px'" :color="'#000'" />
              </span>
              <span v-else-if="header.kind === 'capitalize'" class="text-capitalize"> {{ lodash.get(item, header.value) }}</span>
              <span v-else-if="header.kind === 'link' && header.path && header.pathValue">
                <v-btn :to="`${header.path}${lodash.get(item, header.pathValue)}`" :class="`text-${header.color} text-capitalize`" variant="flat">
                  {{ lodash.get(item, header.value) }}
                </v-btn>
              </span>
              <span v-else-if="header.kind === 'tags'">
                <v-chip v-for="(role, index) in lodash.get(item, header.value)" :key="index" class="mr-2" :index="index">{{ role }}</v-chip>
              </span>
              <span v-else-if="header.kind === 'status'">
                <v-btn variant="flat" icon>
                  <v-icon v-if="lodash.get(item, header.value) === true" color="green" icon="fa-solid fa-check" />
                  <v-icon v-else-if="lodash.get(item, header.value) === false" color="red" icon="fa-solid fa-times" />
                  <v-icon v-else class="rotating" color="orange" icon="fa-solid fa-spinner" />
                </v-btn>
              </span>
              <span v-else-if="header.kind === 'superior'">
                <span v-if="lodash.get(item, header.value) > header.condition" class="text-green">
                  {{ lodash.get(item, header.value) }}
                </span>
                <span v-else class="text-red">{{ lodash.get(item, header.value) || header.condition }}</span>
              </span>
              <span v-else-if="header.kind === 'inferior'">
                <span v-if="lodash.get(item, header.value) < header.condition" color="green">
                  {{ lodash.get(item, header.value) }}
                </span>
                <span v-else color="red">{{ lodash.get(item, header.value) || header.condition }}</span>
              </span>
              <span v-else>{{ lodash.get(item, header.value) }}</span>
            </span>
          </td>
        </tr>
      </tbody>
    </v-table>
    <v-row v-if="!items.length || items.length === 0">
      <v-col cols="12">
        <h2 class="text-center pa-12">No Items found :( !</h2>
      </v-col>
    </v-row>
    <v-card-actions>
      <v-switch
        v-if="auto != null ? auto : true"
        v-model="refresh"
        class="ml-2"
        label="Auto Refresh"
        :color="theme.current.colors.secondary"
      ></v-switch>
      <v-spacer></v-spacer>
      <v-select v-model="options.itemsPerPage" :items="perPage" label="Items per page" style="max-width: 150px; width: 150px"></v-select>
      <v-btn :disabled="options.page <= 1" variant="flat" class="mb-8" icon @click="switchPage('-')">
        <v-icon icon="fa-solid fa-angle-left"></v-icon>
      </v-btn>
      <v-btn variant="flat" disabled class="mb-8">
        {{ options.page }}
      </v-btn>
      <v-btn :disabled="items.length < options.itemsPerPage" variant="flat" class="mb-8 mr-2" icon @click="switchPage('+')">
        <v-icon icon="fa-solid fa-angle-right"></v-icon>
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
/**
 * Module dependencies.
 */
import { debounce } from 'lodash-es';
import { useTheme } from 'vuetify';
import { useUsersStore } from '../../users/stores/users.store';
import * as tools from '../../../lib/helpers/tools';
import userAvatarComponent from '../../users/components/user.avatar.component.vue';
/**
 * Component definition.
 */
export default {
  name: 'CoreDatatable',
  components: {
    userAvatarComponent,
  },
  props: {
    headers: {
      type: Array,
      required: true,
    },
    items: {
      type: Array,
      required: true,
    },
    request: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      default: '',
    },
    settings: {
      type: Object,
      default: null,
    },
    auto: {
      type: Boolean,
      default: true,
    },
    search: {
      type: Boolean,
      default: true,
    },
    filter: {
      type: String,
      default: '',
    },
  },
  data() {
    const theme = useTheme();
    return {
      theme,
      refresh: false,
      textSearch: '',
      loading: true,
      perPage: [5, 50, 100],
      options: {
        page: 1,
        itemsPerPage: 5,
      },
    };
  },
  computed: {
    themeName() {
      return this.theme.global.name.value;
    },
  },
  watch: {
    options: {
      async handler(options) {
        this.loading = true;
        await this.callStoreAction(tools.pageRequest(options.page, options.itemsPerPage, this.textSearch));
        this.loading = false;
      },
      deep: true,
    },
  },
  created() {
    if (this.settings) {
      if (this.settings.perPage) this.perPage = this.settings.perPage;
      if (this.settings.page) this.page = this.options.settings.page;
      if (this.settings.itemsPerPage) this.options.itemsPerPage = this.settings.itemsPerPage;
    }
    if (this.filter) {
      this.textSearch = this.filter;
    }
    this.gettextSearch();
    this.watchtextSearch = this.$watch(
      'textSearch',
      debounce(() => {
        this.gettextSearch();
      }, 1000),
    );
  },
  mounted() {
    window.setInterval(() => {
      if (this.refresh) {
        this.loading = true;
        this.callStoreAction(tools.pageRequest(1, this.options.itemsPerPage, this.textSearch)).then(() => {
          this.loading = false;
        });
        setTimeout(() => {
          this.loading = false;
        }, 30000);
      }
    }, 5000);
  },
  beforeUnmount() {
    this.watchtextSearch();
  },
  methods: {
    async callStoreAction(params) {
      const usersStore = useUsersStore();
      if (this.request === 'getUsers') {
        await usersStore.getUsers(params);
      }
    },
    async gettextSearch() {
      this.loading = true;
      await this.callStoreAction(tools.pageRequest(this.options.page, this.options.itemsPerPage, this.textSearch));
      this.loading = false;
    },
    switchPage(sign) {
      if (sign === '-' && this.options.page > 1) {
        this.options.page -= 1;
      }
      if (sign === '+' && this.items.length === this.options.itemsPerPage) {
        this.options.page += 1;
      }
    },
    dispatch(dispatch, key, value, refresh) {
      if (key && value) {
        const option = {};
        option[key] = value;
        this.loading = true;
        this.$store
          .dispatch(dispatch, option)
          .catch((err) => console.log(err))
          .then(() => {
            if (refresh) {
              this.$store.dispatch(this.request, tools.pageRequest(this.options.page, this.options.itemsPerPage, this.textSearch)).then(() => {
                this.loading = false;
              });
            } else {
              this.loading = false;
            }
          });
      } else this.$store.dispatch(dispatch).catch((err) => console.log(err));
    },
  },
};
</script>

<style>
.datatable .v-field__overlay {
  background: none !important;
}
</style>
