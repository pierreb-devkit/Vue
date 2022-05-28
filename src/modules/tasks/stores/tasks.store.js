/**
 * Module dependencies.
 */
import _ from 'lodash';
import model from '../../../lib/middlewares/model';

const whitelists = ['title', 'description'];

/**
 * Getters: get state
 */
const getters = {
  tasks: (state) => state.tasks,
  task: (state) => state.task,
};

/**
 * Actions
 */
const actions = (app) => {
  const config = app.config.globalProperties.config;
  const api = `${config.api.protocol}://${config.api.host}:${config.api.port}/${config.api.base}`;

  return {
    getTasks: async ({ commit }) => {
      try {
        const res = await app.config.globalProperties.axios.get(`${api}/${config.api.endPoints.tasks}/`);
        commit('tasks_set', res.data.data);
      } catch (err) {
        commit('task_error', err);
      }
    },
    getTask: async ({ commit }, params) => {
      try {
        const res = await app.config.globalProperties.axios.get(`${api}/${config.api.endPoints.tasks}/${params.id}`);
        commit('task_set', res.data.data);
      } catch (err) {
        commit('task_error', err);
      }
    },
    createTask: async ({ commit }, params) => {
      try {
        const obj = model.clean(params, whitelists);
        const res = await app.config.globalProperties.axios.post(`${api}/${config.api.endPoints.tasks}/`, obj);
        commit('task_set', res.data.data);
      } catch (err) {
        commit('task_error', err);
      }
    },
    updateTask: async ({ commit, state }, params) => {
      try {
        const obj = model.clean(state.task, whitelists);
        const res = await app.config.globalProperties.axios.put(`${api}/${config.api.endPoints.tasks}/${params.id}`, obj);
        commit('task_update', res.data.data);
      } catch (err) {
        commit('task_error', err);
      }
    },
    deleteTask: async ({ commit }, params) => {
      try {
        await app.config.globalProperties.axios.delete(`${api}/${config.api.endPoints.tasks}/${params.id}`);
        commit('task_reset');
      } catch (err) {
        commit('task_error', err);
      }
    },
  };
};

/**
 * Mutation: change state in a Vuex store is by committing a mutation
 */
const mutations = {
  task_error(err) {
    console.log(err);
  },
  tasks_set(state, data) {
    state.tasks = data;
  },
  task_set(state, data) {
    state.task = data;
  },
  task_update(state, data) {
    _.assign(state.task, data);
  },
  task_reset(state) {
    state.task = {};
  },
};

/**
 * State
 */
const state = () => ({
  task: {
    title: '',
    description: '',
  },
  tasks: [],
});

/**
 * Export default
 */
export default (app) => {
  return {
    state,
    getters,
    actions: actions(app),
    mutations,
  };
};
