<template>
  <v-container fluid>
    <v-row class="ma-2">
      <coreDataTableComponent :headers="headers" :items="users" :request="'getUsers'">deadead</coreDataTableComponent>
    </v-row>
  </v-container>
</template>

<script>
/**
 * Module dependencies.
 */

import { useTheme } from 'vuetify';
import { useAuthStore } from '../../auth/stores/auth.store';
import { useUsersStore } from '../stores/users.store';
import coreDataTableComponent from '../../core/components/core.datatable.component.vue';

/**
 * Component definition.
 */
export default {
  components: {
    coreDataTableComponent,
  },
  data() {
    const theme = useTheme();
    return {
      theme,
      headers: [
        {
          text: 'Avatar',
          value: 'avatar',
          kind: 'avatar',
        },
        {
          text: 'FirstName',
          value: 'firstName',
          kind: 'capitalize',
        },
        {
          text: 'LastName',
          value: 'lastName',
          kind: 'capitalize',
        },
        {
          text: 'Email',
          value: 'email',
          kind: 'email',
        },
        {
          text: 'roles',
          value: 'roles',
          kind: 'tags',
        },
        {
          text: 'updatedAt',
          value: 'updatedAt',
          kind: 'date',
          format: 'DD/MM/YY à HH:mm',
        },
        {
          text: 'createdAt',
          value: 'createdAt',
          kind: 'date',
          format: 'DD/MM/YY à HH:mm',
        },
        {
          text: 'View',
          value: 'id',
          kind: 'link',
          color: 'secondary',
          path: '/users/',
          pathValue: 'id',
        },
        {
          text: 'View',
          value: 'id',
          kind: 'icon',
          icon: 'fa-solid fa-eye',
          color: 'secondary',
          path: '/users/',
          pathValue: 'id',
        },
      ],
    };
  },
  computed: {
    themeName() {
      return this.theme.global.name.value;
    },
    isLoggedIn() {
      const authStore = useAuthStore();
      return authStore.isLoggedIn;
    },
    users() {
      const usersStore = useUsersStore();
      return usersStore.users;
    },
  },
};
</script>
