<template>
  <v-container fluid>
    <!-- Header -->
    <v-row class="mx-2 my-1">
      <v-icon class="ma-2" icon="fa-solid fa-check"></v-icon>
      <h2 class="my-1 text-capitalize">1. Description</h2>
      <v-spacer></v-spacer>
      <v-btn v-if="this.task.id" @click="remove" color="error" icon class="mx-1">
        <v-icon icon="fa-solid fa-trash"></v-icon>
      </v-btn>
      <v-btn v-if="this.task.id" @click="update()" :disabled="!save" color="success" icon class="mx-1">
        <v-icon icon="fa-solid fa-save"></v-icon>
      </v-btn>
    </v-row>
    <!-- Form -->
    <v-row class="pa-2">
      <v-col cols="12" sm="12" md="6" lg="8" xl="9">
        <v-card class="pa-6" :style="{ background: config.vuetify.theme.themes[theme].colors.surface }" :flat="config.vuetify.theme.flat">
          <v-form ref="form" v-model="valid">
            <v-row>
              <v-col cols="12">
                <v-text-field v-model="title" :rules="[rules.required]" label="Title" required></v-text-field>
                <v-text-field v-model="description" :rules="[rules.required]" label="Description" required></v-text-field>
              </v-col>
            </v-row>
            <v-row v-if="!this.task.id">
              <v-btn :disabled="!valid" color="success" class="mr-4" @click="create">Validate</v-btn>
            </v-row>
          </v-form>
        </v-card>
      </v-col>
      <taskComponent v-bind:item="{ title, description }"></taskComponent>
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
  data() {
    return {
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
  components: {
    taskComponent,
  },
  computed: {
    ...mapGetters(['theme', 'task', 'result']),
    title: {
      get() {
        return this.task.title;
      },
      set(title) {
        this.$store.commit('task_update', { title });
      },
    },
    description: {
      get() {
        return this.task.description;
      },
      set(description) {
        this.$store.commit('task_update', { description });
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
  methods: {
    async create() {
      const form = await this.$refs.form.validate();
      if (form.valid) {
        this.$store
          .dispatch('createTask', this.task)
          .then(() => {
            this.save = false;
            // this.$router.push(`/tasks/${this.task.id}`);
            this.$router.push('/tasks');
          })
          .catch((err) => console.log(err));
      }
    },
    async update() {
      const form = await this.$refs.form.validate();
      if (form.valid) {
        this.$store
          .dispatch('updateTask', { id: this.id })
          .then(() => {
            this.save = false;
            this.$router.push('/tasks');
          })
          .catch((err) => console.log(err));
      }
    },
    async remove() {
      const form = await this.$refs.form.validate();
      if (form.valid) {
        this.$store
          .dispatch('deleteTask', { id: this.id })
          .then(() => {
            this.$router.push('/tasks');
          })
          .catch((err) => console.log(err));
      }
    },
  },
  created() {
    if (this.id) {
      this.$store.commit('task_reset');
      this.$store
        .dispatch('getTask', { id: this.id })
        .then(() => {
          this.save = false;
        })
        .catch((err) => console.log(err));
    } else {
      this.$store.commit('task_reset');
    }
  },
};
</script>
