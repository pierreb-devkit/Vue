<template>
  <v-container fluid>
    <!-- Header -->
    <v-row class="mt-3 mx-3">
      <v-subheader>
        <v-icon class="mr-5">fa-check</v-icon>
        <b>1. Description</b>
      </v-subheader>
      <v-spacer></v-spacer>
      <v-btn v-if="this.task.id" color="red lighten-3" @click="remove" icon>
        <v-icon>fa-trash</v-icon>
      </v-btn>
      <v-btn
        v-if="this.task.id"
        class="mr-5"
        color="blue lighten-2"
        @click="update()"
        :disabled="!save"
        icon
      >
        <v-icon>fa-save</v-icon>
      </v-btn>
    </v-row>
    <!-- First Form -->
    <v-row class="mx-3">
      <v-col cols="12" sm="12" md="6" lg="8" xl="9">
        <v-row align="start" justify="center">
          <v-card
            outlined
            tile
            width="100%"
            class="px-10 pa-6"
            :style="{ background: config.vuetify.theme.themes[theme].surface }"
            :flat="config.vuetify.theme.flat"
          >
            <v-form ref="form" v-model="valid">
              <v-row>
                <v-col cols="12">
                  <v-text-field
                    v-model="title"
                    :rules="[rules.required]"
                    label="Title"
                    required
                  ></v-text-field>
                  <v-text-field
                    v-model="description"
                    :rules="[rules.required]"
                    label="Description"
                    required
                  ></v-text-field>
                </v-col>
              </v-row>
              <v-row v-if="!this.task.id">
                <v-btn :disabled="!valid" color="success" class="mr-4" @click="create"
                  >Validate</v-btn
                >
              </v-row>
            </v-form>
          </v-card>
        </v-row>
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
      save: false,
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
        this.save = true;
        this.$store.commit('task_update', { title });
      },
    },
    description: {
      get() {
        return this.task.description;
      },
      set(description) {
        this.save = true;
        this.$store.commit('task_update', { description });
      },
    },
  },
  methods: {
    create() {
      if (this.$refs.form.validate()) {
        this.$store
          .dispatch('createTask', this.task)
          .then(() => {
            this.$router.push(`/tasks/${this.task.id}`);
            this.save = false;
          })
          .catch((err) => console.log(err));
      }
    },
    update() {
      if (this.$refs.form.validate()) {
        const { title } = this;
        const { description } = this;

        const data = {
          id: this.id,
          title,
          description,
        };

        this.$store
          .dispatch('updateTask', data)
          .then(() => {
            this.save = false;
          })
          .catch((err) => console.log(err));
      }
    },
    remove() {
      if (this.$refs.form.validate()) {
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
      this.$store.dispatch('getTask', this.id).catch((err) => console.log(err));
    } else {
      this.$store.commit('task_reset');
    }
  },
};
</script>
