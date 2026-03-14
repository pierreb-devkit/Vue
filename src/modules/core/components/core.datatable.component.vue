<template>
  <v-card width="100%" class="datatable" color="surface" :flat="config.vuetify.theme.flat" :class="config.vuetify.theme.rounded">
    <v-card-title class="d-flex align-center">
      <span class="text-title-medium">{{ title }}</span>
      <v-spacer></v-spacer>
      <v-text-field
        v-if="search"
        v-model="textSearch"
        placeholder="Search"
        hide-details
        density="compact"
        variant="outlined"
        prepend-inner-icon="fa-solid fa-magnifying-glass"
        style="max-width: 280px"
        :class="config.vuetify.theme.rounded"
      ></v-text-field>
    </v-card-title>
    <v-progress-linear :active="loading" indeterminate color="secondary"></v-progress-linear>
    <v-table v-if="items && items.length > 0" fixed-header>
      <thead>
        <tr>
          <th v-for="header in headers" :key="header.text" class="text-left text-label-medium">{{ header.text }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in items" :key="item._id || item.id">
          <td v-for="header in headers" :key="header.text" class="text-body-medium">
            <span v-if="header.value">
              <span v-if="header.kind === 'date' && header.format">
                {{ lodash.get(item, header.value) && new Date(lodash.get(item, header.value)).getTime() > 0 ? dayjs(new Date(lodash.get(item, header.value))).format(header.format) : '—' }}
              </span>
              <span v-else-if="header.kind === 'icon'">
                <v-btn v-if="header.path && header.pathValue" :to="`${header.path}${lodash.get(item, header.pathValue)}`" variant="text" icon size="small">
                  <v-icon :color="header.color" :icon="header.icon" size="small"></v-icon>
                </v-btn>
                <v-btn
                  v-else-if="header.dispatch && header.param"
                  variant="text"
                  icon
                  size="small"
                  @click="dispatch(header.dispatch, header.param, lodash.get(item, header.param), header.refresh)"
                >
                  <v-icon :color="header.color" :icon="header.icon" size="small"></v-icon>
                </v-btn>
                <v-btn v-else variant="text" icon size="small">
                  <v-icon :color="header.color" :icon="header.icon" size="small"></v-icon>
                </v-btn>
              </span>
              <span v-else-if="header.kind === 'email'">
                <a :href="`mailto:${lodash.get(item, header.value)}`" class="text-primary">{{ lodash.get(item, header.value) }}</a>
              </span>
              <span v-else-if="header.kind === 'avatar'">
                <userAvatarComponent :user="item" :width="'37px'" :height="'37px'" :radius="'50%'" :border="'0px'" :color="'#000'" />
              </span>
              <span v-else-if="header.kind === 'capitalize'" class="text-capitalize"> {{ lodash.get(item, header.value) }}</span>
              <span v-else-if="header.kind === 'link' && header.path && header.pathValue">
                <v-btn :to="`${header.path}${lodash.get(item, header.pathValue)}`" :class="`text-${header.color} text-capitalize`" variant="text">
                  {{ lodash.get(item, header.value) }}
                </v-btn>
              </span>
              <span v-else-if="header.kind === 'tags'">
                <v-chip v-for="(role, index) in lodash.get(item, header.value)" :key="index" class="mr-1" size="small" :index="index">{{ role }}</v-chip>
              </span>
              <span v-else-if="header.kind === 'status'">
                <v-icon v-if="lodash.get(item, header.value) === true" color="success" icon="fa-solid fa-check" size="small" />
                <v-icon v-else-if="lodash.get(item, header.value) === false" color="error" icon="fa-solid fa-times" size="small" />
                <v-icon v-else class="rotating" color="warning" icon="fa-solid fa-spinner" size="small" />
              </span>
              <span v-else-if="header.kind === 'superior'">
                <span v-if="lodash.get(item, header.value) > header.condition" class="text-success">
                  {{ lodash.get(item, header.value) }}
                </span>
                <span v-else class="text-error">{{ lodash.get(item, header.value) || header.condition }}</span>
              </span>
              <span v-else-if="header.kind === 'inferior'">
                <span v-if="lodash.get(item, header.value) < header.condition" class="text-success">
                  {{ lodash.get(item, header.value) }}
                </span>
                <span v-else class="text-error">{{ lodash.get(item, header.value) || header.condition }}</span>
              </span>
              <span v-else-if="header.kind === 'slot'">
                <slot :name="header.slotName || header.value" :item="item" :header="header"></slot>
              </span>
              <span v-else>{{ lodash.get(item, header.value) }}</span>
            </span>
          </td>
        </tr>
      </tbody>
    </v-table>
    <v-empty-state
      v-if="!items || !items.length"
      icon="fa-solid fa-inbox"
      text="No items found"
      class="py-8"
    ></v-empty-state>
    <v-divider></v-divider>
    <v-card-actions class="px-4 py-4">
      <v-switch
        v-if="auto"
        v-model="refresh"
        class="ml-2"
        label="Auto Refresh"
        density="compact"
        color="secondary"
        hide-details
      ></v-switch>
      <v-spacer></v-spacer>
      <span class="text-body-small text-medium-emphasis mr-2">Per page</span>
      <v-select
        v-model="options.itemsPerPage"
        :items="perPage"
        density="compact"
        variant="outlined"
        hide-details
        style="max-width: 80px"
        :class="config.vuetify.theme.rounded"
      ></v-select>
      <v-btn :disabled="options.page <= 1" variant="text" icon size="small" class="ml-2" @click="switchPage('-')">
        <v-icon icon="fa-solid fa-angle-left" size="small"></v-icon>
      </v-btn>
      <span class="text-body-medium mx-1">{{ options.page }}</span>
      <v-btn :disabled="items.length < options.itemsPerPage" variant="text" icon size="small" class="mr-1" @click="switchPage('+')">
        <v-icon icon="fa-solid fa-angle-right" size="small"></v-icon>
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
/**
 * Module dependencies.
 */
import { debounce } from 'lodash-es';
import * as tools from '../../../lib/helpers/tools';
import userAvatarComponent from './user.avatar.component.vue';
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
    fetchAction: {
      type: Function,
      default: null,
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
      default: false,
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
  emits: ['dispatch'],
  data() {
    return {
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
  computed: {},
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
    if (this.auto) {
      let refreshing = false;
      this.refreshInterval = window.setInterval(async () => {
        if (this.refresh && !refreshing) {
          refreshing = true;
          this.loading = true;
          try {
            await this.callStoreAction(tools.pageRequest(1, this.options.itemsPerPage, this.textSearch));
          } finally {
            this.loading = false;
            refreshing = false;
          }
        }
      }, 5000);
    }
  },
  beforeUnmount() {
    this.watchtextSearch();
    if (this.refreshInterval) clearInterval(this.refreshInterval);
  },
  methods: {
    /**
     * Call the parent-provided fetch action with pagination params.
     * @param {string} params - Pagination query string from tools.pageRequest (e.g. "0&5&search")
     * @returns {Promise<void>} Resolves when the fetch action completes
     */
    async callStoreAction(params) {
      if (this.fetchAction) {
        try {
          await this.fetchAction(params);
        } catch (err) {
          console.error('fetchAction failed:', err);
        }
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
    /**
     * Emit a dispatch event for parent-handled actions (replaces legacy Vuex $store.dispatch).
     * @param {string} action - The action name to dispatch
     * @param {string} key - The parameter key
     * @param {*} value - The parameter value
     * @param {boolean} refresh - Whether to refresh the datatable after the action
     */
    dispatch(action, key, value, refresh) {
      if (key && value) {
        const option = { [key]: value };
        this.loading = true;
        this.$emit('dispatch', { action, option, done: () => this.onDispatchDone(refresh) });
      } else {
        this.$emit('dispatch', { action });
      }
    },
    /**
     * Handle post-dispatch cleanup: optionally refresh data, then reset loading.
     * @param {boolean} refresh - Whether to refresh the datatable
     * @returns {Promise<void>} Resolves when refresh completes
     */
    async onDispatchDone(refresh) {
      if (refresh) {
        await this.callStoreAction(tools.pageRequest(this.options.page, this.options.itemsPerPage, this.textSearch));
      }
      this.loading = false;
    },
  },
};
</script>

<style>
.datatable .v-field__overlay {
  background: none !important;
}
</style>
