/**
 * Module dependencies.
 */
import Vue from 'vue';
import _ from 'lodash';
import config from '@/config';
import model from '@/lib/middlewares/model';

const api = `${config.api.protocol}://${config.api.host}:${config.api.port}/${config.api.base}`;
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
const actions = {
  getTasks: async ({ commit }) => {
    try {
      const res = await Vue.prototype.axios.get(`${api}/${config.api.endPoints.tasks}/`);
      commit('tasks_set', res.data.data);
    } catch (err) {
      commit('task_error', err);
    }
  },
  getTask: async ({ commit }, params) => {
    try {
      const res = await Vue.prototype.axios.get(`${api}/${config.api.endPoints.tasks}/${params}`);
      commit('task_set', res.data.data);
    } catch (err) {
      commit('task_error', err);
    }
  },
  createTask: async ({ commit }, params) => {
    try {
      const obj = model.clean(params, whitelists);
      const res = await Vue.prototype.axios.post(`${api}/${config.api.endPoints.tasks}/`, obj);
      commit('task_set', res.data.data);
    } catch (err) {
      commit('task_error', err);
    }
  },
  updateTask: async ({ commit, state }, params) => {
    try {
      const obj = model.clean(_.merge(state.task, params), whitelists);
      const res = await Vue.prototype.axios.put(`${api}/${config.api.endPoints.tasks}/${params.id}`, obj);
      commit('task_update', res.data.data);
    } catch (err) {
      commit('task_error', err);
    }
  },
  deleteTask: async ({ commit }, params) => {
    try {
      await Vue.prototype.axios.delete(`${api}/${config.api.endPoints.tasks}/${params.id}`);
      commit('task_reset');
    } catch (err) {
      commit('task_error', err);
    }
  },
};

/**
 * Mutation: change state in a Vuex store is by committing a mutation
 */
const mutations = {
  // tasks
  task_error(state, err) {
    console.log(err);
  },
  tasks_set(state, data) {
    state.tasks = data;
  },
  task_set(state, data) {
    state.task = data;
  },
  task_update(state, data) {
    _.merge(state.task, data);
  },
  task_reset(state) {
    state.task = {};
  },
};

/**
 * State
 */
const state = {
  task: {
    title: '',
    description: '',
  },
  tasks: [],
};

/**
 * Export default
 */
export default {
  state,
  getters,
  actions,
  mutations,
};
