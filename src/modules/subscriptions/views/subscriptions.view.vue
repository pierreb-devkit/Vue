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
          Subscriptions
          <v-spacer></v-spacer>
          <v-text-field v-model="search" label="Search" single-line hide-details></v-text-field>
        </v-card-title>
        <v-data-table
          :headers="headers"
          :items="subscriptions"
          :sort-by="['createdAt']"
          :sort-desc="[true]"
          :items-per-page="row"
          :style="{ background: config.vuetify.theme.themes[theme].surface }"
          :flat="config.vuetify.theme.flat"
          :search="search"
        >
          <template v-slot:[`item.avatar`]="{ item }">
            <userArrayComponent
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
            <v-btn v-if="item.id" :to="`/subscriptions/${item.id}`" icon>
              <v-icon>fa-eye</v-icon>
            </v-btn>
          </template>
        </v-data-table>
      </v-card>
      <v-row v-if="!subscriptions.length" align="start" justify="center">
        <v-col cols="12">
          <v-card
            class="mx-3 pa-8"
            outlined
            tile
            :style="{ background: config.vuetify.theme.themes[theme].surface }"
            :flat="config.vuetify.theme.flat"
          >
            <h2 class="text-center">No Subscriptions found :( !</h2>
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
import userArrayComponent from '../../users/components/user.avatar.component.vue';

/**
 * Export default
 */
export default {
  data: () => ({
    search: '',
    row: 20,
    headers: [
      { text: 'Avatar', value: 'avatar' },
      { text: 'Email', value: 'email' },
      { text: 'updatedAt', value: 'updatedAt' },
      { text: 'createdAt', value: 'createdAt' },
      { text: 'View', value: 'id' },
    ],
  }),
  components: {
    userArrayComponent,
  },
  computed: {
    ...mapGetters(['theme', 'isLoggedIn', 'subscriptions']),
  },
  created() {
    this.$store.dispatch('getSubscriptions');
  },
};
</script>
