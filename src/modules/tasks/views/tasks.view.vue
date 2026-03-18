<template>
  <v-container fluid>
    <PageHeader icon="fa-solid fa-list-check" title="Tasks">
      <template #actions>
        <v-btn
          v-if="isLoggedIn"
          color="primary"
          variant="flat"
          :class="config.vuetify.theme.rounded"
          class="text-none text-body-medium"
          to="/task"
        >
          <v-icon icon="fa-solid fa-plus" size="small" class="mr-2"></v-icon>
          New Task
        </v-btn>
      </template>
    </PageHeader>
    <v-row class="pa-2 mt-0">
      <taskComponent v-for="(item, index) in tasks" :key="item.id" :item="item" :index="index"></taskComponent>
    </v-row>
    <v-row v-if="!tasks || !tasks.length" align="start" justify="center">
      <v-col cols="12">
        <v-card class="ma-6 pa-8 text-center" color="surface" :flat="config.vuetify.theme.flat" :class="config.vuetify.theme.rounded">
          <v-icon icon="fa-solid fa-list-check" size="x-large" color="primary" class="mb-4 text-medium-emphasis"></v-icon>
          <h2 class="text-title-large font-weight-medium mb-2">No tasks yet</h2>
          <p class="text-body-medium text-medium-emphasis mb-4">Create your first task to get started.</p>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
/**
 * Module dependencies.
 */
import { useTheme } from 'vuetify';
import { useAuthStore } from '../../auth/stores/auth.store';
import { useTasksStore } from '../stores/tasks.store';
import taskComponent from '../components/task.component.vue';
import PageHeader from '../../core/components/core.pageHeader.component.vue';
/**
 * Component definition.
 */
export default {
  components: {
    taskComponent,
    PageHeader,
  },
  data() {
    const theme = useTheme();
    return {
      theme,
    };
  },
  computed: {
    themeName() {
      return this.theme.name;
    },
    isLoggedIn() {
      const authStore = useAuthStore();
      return authStore.isLoggedIn;
    },
    tasks() {
      const tasksStore = useTasksStore();
      return tasksStore.tasks;
    },
  },
  created() {
    const tasksStore = useTasksStore();
    tasksStore.getTasks();
  },
};
</script>
