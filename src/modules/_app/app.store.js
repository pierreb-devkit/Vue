/**
 * Module dependencies.
 */
import { createStore } from 'vuex';
import core from '../_core/stores/core.store';
import auth from '../auth/stores/auth.store';
import users from '../users/stores/users.store';
import home from '../home/stores/home.store';
import tasks from '../tasks/stores/tasks.store';

const debug = process.env.NODE_ENV !== 'production';

/**
 * Vuex configuration
 */
const getStore = (app) => {
  return createStore({
    state: {
      name: 'Vue',
    },
    modules: {
      core: core(app),
      auth: auth(app),
      users: users(app),
      home: home(app),
      tasks: tasks(app),
    },
    strict: debug,
  });
};

export default getStore;
