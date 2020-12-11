/**
 * Module dependencies.
 */
import Vue from 'vue';
import Vuex from 'vuex';
import core from '@/modules/_core/stores/core.store';
import auth from '@/modules/auth/stores/auth.store';
import users from '@/modules/users/stores/users.store';
import home from '@/modules/home/stores/home.store';
import tasks from '@/modules/tasks/stores/tasks.store';

const debug = process.env.NODE_ENV !== 'production';

/**
 * Vuex configuration
 */
Vue.use(Vuex);

/**
 * Export default
 */
export default new Vuex.Store({
  modules: {
    core,
    auth,
    users,
    home,
    tasks,
  },
  strict: debug,
});
