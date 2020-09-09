/**
 * Module dependencies.
 */
import Vue from 'vue';
import _ from 'lodash';
import config from '@/config';
import model from '@/lib/middlewares/model';

const api = `${config.api.protocol}://${config.api.host}:${config.api.port}/${config.api.base}`;
const whitelists = ['firstName', 'lastName', 'bio', 'email', 'avatar', 'roles'];

/**
 * Getters: get state
 */
const getters = {
  subscriptions: (state) => state.subscriptions,
  subscription: (state) => state.subscription,
};

/**
 * Actions
 */
const actions = {
  getSubscriptions: async ({ commit }) => {
    try {
      const res = await Vue.prototype.axios.get(`${api}/${config.api.endPoints.subscriptions}/`);
      commit('subscriptions_set', res.data.data);
    } catch (err) {
      commit('subscription_error', err);
    }
  },
  getSubscription: async ({ commit }, params) => {
    try {
      const res = await Vue.prototype.axios.get(
        `${api}/${config.api.endPoints.subscriptions}/${params}`,
      );
      commit('subscription_set', res.data.data);
    } catch (err) {
      commit('subscription_error', err);
    }
  },
  updateSubscription: async ({ commit, state }, params) => {
    try {
      const obj = model.clean(_.merge(state.subscription, params), whitelists);
      const res = await Vue.prototype.axios.put(
        `${api}/${config.api.endPoints.subscriptions}/${params.id}`,
        obj,
      );
      commit('subscription_update', res.data.data);
    } catch (err) {
      commit('subscription_error', err);
    }
  },
  deleteSubscription: async ({ commit }, params) => {
    try {
      await Vue.prototype.axios.delete(`${api}/${config.api.endPoints.subscriptions}/${params.id}`);
      commit('subscription_reset');
    } catch (err) {
      commit('subscription_error', err);
    }
  },
};

/**
 * Mutation: change state in a Vuex store is by committing a mutation
 */
const mutations = {
  // global
  subscription_error(state, err) {
    console.log('subscription_error', err);
  },
  // scraps
  subscriptions_set(state, data) {
    state.subscriptions = data;
  },
  // scrap
  subscription_set(state, data) {
    state.subscription = data;
  },
  subscription_update(state, data) {
    _.merge(state.subscription, data);
  },
  subscription_reset(state) {
    state.subscription = {};
  },
};

/**
 * State
 */
const state = {
  subscription: {
    firstName: '',
    lastName: '',
    bio: '',
    email: '',
    avatar: '',
    roles: [],
    updated: '',
    created: '',
  },
  subscriptions: [],
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
