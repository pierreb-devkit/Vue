/**
 * Module dependencies.
 */
import Vue from 'vue';
import _ from 'lodash';
import config from '@/config';
import model from '@/lib/middlewares/model';
import tools from '@/lib/helpers/tools';
import GhostContentAPI from '@tryghost/content-api';

const api = `${config.api.protocol}://${config.api.host}:${config.api.port}/${config.api.base}`;
const whitelists = ['email', 'news'];

/**
 * Getters: get state
 */
const getters = {
  contents: (state) => state.contents,
  news: (state) => state.news,
  homeSubscription: (state) => state.subscription,
  contact: (state) => state.contact,
  statistics: (state) => state.statistics,
  news2: (state) => state.news2,
  news3: (state) => state.news3,
};

/**
 * Actions
 */
const actions = {
  getChangelogs: async ({ commit }) => {
    try {
      const changelogs = await Vue.prototype.axios.get(
        `${api}/${config.api.endPoints.core}/changelogs`,
      );
      commit(
        'contents_set',
        changelogs.data.data.map((item) => ({
          title: item.title,
          markdown: item.markdown.replace(/\[([^\\[\]]*)\]\((.*?)\)/gm, '$1').replace(/\(\w{7}\)/g, ''),
          style: 'air',
        })),
      );
    } catch (err) {
      commit('error', err);
    }
  },
  getNews: async ({ commit }) => {
    try {
      const ghost = new GhostContentAPI({
        url: config.home.blog.url,
        key: config.home.blog.key,
        version: 'v3',
      });
      const res = await ghost.posts.browse({ limit: 3, filter: 'tag:dev' });
      commit('news_set', res);
    } catch (err) {
      commit('error', err);
    }
  },
  createSubscription: async ({ commit }, params) => {
    try {
      const obj = model.clean(params, whitelists);
      obj.news = true;
      const res = await Vue.prototype.axios.post(
        `${api}/${config.api.endPoints.subscriptions}/`,
        obj,
      );
      commit('subscription_set', res.data.data);
    } catch (err) {
      commit('error', err);
    }
  },
  getStatistics: async ({ commit }) => {
    try {
      // const tasks = await Vue.prototype.axios.get(`${api}/${config.api.endPoints.tasks}/stats`);
      // const users = await Vue.prototype.axios.get(`${api}/${config.api.endPoints.users}/stats`);
      const releases = await Vue.prototype.axios.get(`${api}/${config.api.endPoints.core}/releases`);
      const pulls = await Vue.prototype.axios.get(`${api}/${config.api.endPoints.core}/pulls`);
      const ghost = new GhostContentAPI({
        url: config.home.blog.url,
        key: config.home.blog.key,
        version: 'v3',
      });
      const articles = await ghost.posts.browse({ limit: 1 });

      commit('statistics_set', {
        // tasks: tasks.data.data,
        // users: users.data.data,
        releases: releases.data.data,
        pulls: pulls.data.data,
        articles: articles.meta,
      });
    } catch (err) {
      commit('error', err);
    }
  },
  getNews2: async ({ commit }) => {
    try {
      const ghost = new GhostContentAPI({
        url: config.home.blog2.url,
        key: config.home.blog2.key,
        version: 'v3',
      });
      const res = await ghost.posts.browse({ limit: 3, filter: 'tag:news' });
      commit('news2_set', res);
    } catch (err) {
      commit('error', err);
    }
  },
  getNews3: async ({ commit }) => {
    try {
      const ghost = new GhostContentAPI({
        url: config.home.blog2.url,
        key: config.home.blog2.key,
        version: 'v3',
      });
      const res = await ghost.posts.browse({ limit: 3, filter: 'tag:hobbies' });
      commit('news3_set', res);
    } catch (err) {
      commit('error', err);
    }
  },
};

/**
 * Mutation: change state in a Vuex store is by committing a mutation
 */
const mutations = {
  error(err) {
    console.log(err);
  },
  // news
  contents_set(state, data) {
    state.contents = data;
  },
  // news
  news_set(state, data) {
    state.news = data;
  },
  // mail
  subscription_set(state, data) {
    state.subscription = data;
  },
  subscription_update(state, data) {
    _.merge(state.subscription, data);
  },
  // mail
  contact_set(state, data) {
    state.contact = data;
  },
  contact_update(state, data) {
    _.merge(state.contact, data);
  },
  // statistics
  statistics_set(state, data) {
    state.statistics[0].value = data.releases.length;
    state.statistics[1].value = _.sum(_.flatten(data.releases.map((release) => {
      if (release.list.length > 0) {
        return tools.releasesNumber(release.list[0].name);
      } return 0;
    })).map((x) => +x));
    state.statistics[2].value = data.articles.pagination.total;
    state.statistics[3].value = _.sum(data.pulls.map((pull) => pull.data.pull_count));
  },
  // news
  news2_set(state, data) {
    state.news2 = data;
  },
  news3_set(state, data) {
    state.news3 = data;
  },
};

/**
 * State
 */
const state = {
  contents: [],
  news: [],
  subscription: {},
  contact: {},
  statistics: config.home.stats.data,
  news2: [],
  news3: [],
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
