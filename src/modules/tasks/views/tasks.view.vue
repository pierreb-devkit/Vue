<template>
  <v-container fluid>
    <v-btn
      :flat="config.vuetify.theme.flat"
      v-if="isLoggedIn"
      icon
      to="/task"
      color="success"
      style="position: absolute; top: 10px; right: 10px; z-index: 1"
    >
      <v-icon icon="fa-solid fa-plus"></v-icon>
    </v-btn>
    <v-row class="pa-2">
      <taskComponent v-for="(item, index) in tasks" v-bind:item="item" v-bind:index="index" v-bind:key="item.id"></taskComponent>
    </v-row>
    <v-row v-if="!tasks || !tasks.length" align="start" justify="center">
      <v-col cols="12">
        <v-card class="ma-6 pa-6" :style="{ background: config.vuetify.theme.themes[theme].colors.surface }" :flat="config.vuetify.theme.flat">
          <h2 class="text-center">No Tasks found :( !</h2>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
/**
 * Module dependencies.
 */
import { mapGetters } from 'vuex';
import taskComponent from '../components/task.component.vue';
/**
 * Export default
 */
export default {
  data: () => ({
    direction: 'bottom',
    fab: false,
    fling: false,
    hover: false,
    tabs: null,
    top: true,
    right: true,
    bottom: false,
    left: false,
    transition: 'slide-y',
  }),
  components: {
    taskComponent,
  },
  computed: {
    ...mapGetters(['theme', 'isLoggedIn', 'tasks']),
  },
  created() {
    this.$store.dispatch('getTasks');
  },
};
</script>
