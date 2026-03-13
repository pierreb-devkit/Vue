<template>
  <v-container fluid>
    <!-- Header -->
    <PageHeader icon="fa-solid fa-check" :title="task.title || 'New Task'" title-class="text-capitalize">
      <template #actions>
        <v-btn v-if="task.id" color="error" variant="tonal" :class="config.vuetify.theme.rounded" class="text-none text-body-medium mr-2" @click="remove">
          <v-icon icon="fa-solid fa-trash" size="small" class="mr-2"></v-icon>
          Delete
        </v-btn>
        <v-btn v-if="task.id" :disabled="!save" color="primary" variant="flat" :class="config.vuetify.theme.rounded" class="text-none text-body-medium" @click="update()">
          <v-icon icon="fa-solid fa-save" size="small" class="mr-2"></v-icon>
          Save
        </v-btn>
      </template>
    </PageHeader>
    <!-- Form -->
    <v-row class="pa-2">
      <v-col cols="12" sm="12" md="6" lg="8" xl="9">
        <v-card class="pa-6" color="surface" :flat="config.vuetify.theme.flat" :class="config.vuetify.theme.rounded">
          <v-form ref="form" v-model="valid">
            <v-row>
              <v-col cols="12">
                <v-text-field v-model="title" :rules="[rules.required]" label="Title" required></v-text-field>
                <v-text-field v-model="description" :rules="[rules.required]" label="Description" required></v-text-field>
              </v-col>
            </v-row>
            <v-row v-if="!task.id">
              <v-btn :disabled="!valid" color="success" class="mr-4" @click="create">Validate</v-btn>
            </v-row>
          </v-form>
        </v-card>
      </v-col>
      <taskComponent :item="{ title, description }"></taskComponent>
    </v-row>
  </v-container>
</template>

<script>
/**
 * Module dependencies.
 */
import { useTheme } from 'vuetify';
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
      // vue
      id: this.$route.params.id ? this.$route.params.id : null,
      save: null,
      // Description
      valid: false,
      rules: {
        required: (v) => !!v || 'Required',
      },
      // request
      loading: false,
    };
  },
  computed: {
    themeName() {
      return this.theme.name;
    },
    task() {
      const tasksStore = useTasksStore();
      return tasksStore.task;
    },
    result() {
      const tasksStore = useTasksStore();
      return tasksStore.result;
    },
    title: {
      get() {
        return this.task.title;
      },
      set(title) {
        const tasksStore = useTasksStore();
        tasksStore.task.title = title;
      },
    },
    description: {
      get() {
        return this.task.description;
      },
      set(description) {
        const tasksStore = useTasksStore();
        tasksStore.task.description = description;
      },
    },
  },
  watch: {
    task: {
      handler() {
        this.save = true;
      },
      deep: true,
    },
  },
  async created() {
    const tasksStore = useTasksStore();
    if (this.id) {
      tasksStore.resetTask();
      try {
        await tasksStore.getTask({ id: this.id });
        this.save = false;
      } catch (err) {
        console.log(err);
      }
    } else {
      tasksStore.resetTask();
    }
  },
  methods: {
    async create() {
      const form = await this.$refs.form.validate();
      if (form.valid) {
        const tasksStore = useTasksStore();
        try {
          await tasksStore.createTask(this.task);
          this.save = false;
          this.$router.push('/tasks');
        } catch (err) {
          console.log(err);
        }
      }
    },
    async update() {
      const form = await this.$refs.form.validate();
      if (form.valid) {
        const tasksStore = useTasksStore();
        try {
          await tasksStore.updateTask({ id: this.id });
          this.save = false;
          this.$router.push('/tasks');
        } catch (err) {
          console.log(err);
        }
      }
    },
    async remove() {
      const form = await this.$refs.form.validate();
      if (form.valid) {
        const tasksStore = useTasksStore();
        try {
          await tasksStore.deleteTask({ id: this.id });
          this.$router.push('/tasks');
        } catch (err) {
          console.log(err);
        }
      }
    },
  },
};
</script>
