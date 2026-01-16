<template>
  <v-container fluid>
    <!-- Header -->
    <v-row class="mx-2 my-1">
      <v-icon class="ma-2" icon="fa-solid fa-check"></v-icon>
      <h2 class="my-1 text-capitalize">1. Description</h2>
      <v-spacer></v-spacer>
      <v-btn v-if="task.id" color="error" icon class="mx-1" @click="remove">
        <v-icon icon="fa-solid fa-trash"></v-icon>
      </v-btn>
      <v-btn v-if="task.id" :disabled="!save" color="success" icon class="mx-1" @click="update()">
        <v-icon icon="fa-solid fa-save"></v-icon>
      </v-btn>
    </v-row>
    <!-- Form -->
    <v-row class="pa-2">
      <v-col cols="12" sm="12" md="6" lg="8" xl="9">
        <v-card class="pa-6" :style="{ background: config.vuetify.theme.themes[themeName].colors.surface }" :flat="config.vuetify.theme.flat">
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

/**
 * Component definition.
 */
export default {
  components: {
    taskComponent,
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
      return this.theme.global.name.value;
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
        await tasksStore.getTask(this, { id: this.id });
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
          await tasksStore.createTask(this, this.task);
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
          await tasksStore.updateTask(this, { id: this.id });
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
          await tasksStore.deleteTask(this, { id: this.id });
          this.$router.push('/tasks');
        } catch (err) {
          console.log(err);
        }
      }
    },
  },
};
</script>
