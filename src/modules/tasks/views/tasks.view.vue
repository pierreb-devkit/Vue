<template>
  <v-container fluid>
    <v-layout wrap align-content-space-around text-xs-center>
      <taskComponent
        v-for="(item, index) in tasks"
        v-bind:item="item"
        v-bind:index="index"
        v-bind:key="item.id"
      ></taskComponent>
      <v-row v-if="!tasks || !tasks.length" align="start" justify="center">
        <v-col cols="12">
          <v-card
            class="ma-6 pa-6"
            :style="{ background: config.vuetify.theme.themes[theme].surface }"
            :flat="config.vuetify.theme.flat"
          >
            <h2 class="text-center">No Tasks found :( !</h2>
          </v-card>
        </v-col>
      </v-row>
      <v-speed-dial
        v-if="isLoggedIn"
        v-model="fab"
        :top="top"
        :bottom="bottom"
        :right="right"
        :left="left"
        :direction="direction"
        :open-on-hover="hover"
        :transition="transition"
        style="position: absolute;"
      >
        <template v-slot:activator>
          <v-btn v-model="fab" color="blue darken-2" dark fab depressed>
            <v-icon v-if="fab">fa-times</v-icon>
            <v-icon v-else>fa-ellipsis-v</v-icon>
          </v-btn>
        </template>
        <v-btn to="/task" color="green" fab dark small depressed>
          <v-icon color="white">fa-plus</v-icon>
        </v-btn>
      </v-speed-dial>
    </v-layout>
  </v-container>
</template>

<script>
/**
 * Module dependencies.
 */
import { mapGetters } from 'vuex';
import taskComponent from '@/modules/tasks/components/task.component.vue';
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
