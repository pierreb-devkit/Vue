/**
 * Module dependencies.
 */
import { defineStore } from 'pinia';
import { assign } from 'lodash-es';
import axios from '../../../lib/services/axios';
import config from '../../../lib/services/config';
import model from '../../../lib/middlewares/model';

/**
 * Whitelists.
 */
const whitelists = ['title', 'description'];

/**
 * Store definition.
 */
export const useTasksStore = defineStore('tasks', {
  state: () => ({
    task: {
      title: '',
      description: '',
    },
    tasks: [],
  }),

  actions: {
    async getTasks() {
      const api = `${config.api.protocol}://${config.api.host}:${config.api.port}/${config.api.base}`;

      try {
        const res = await axios.get(`${api}/${config.api.endPoints.tasks}/`);
        this.tasks = res.data.data;
      } catch (err) {
        console.log(err);
      }
    },

    async getTask(params) {
      const api = `${config.api.protocol}://${config.api.host}:${config.api.port}/${config.api.base}`;

      try {
        const res = await axios.get(`${api}/${config.api.endPoints.tasks}/${params.id}`);
        this.task = res.data.data;
      } catch (err) {
        console.log(err);
      }
    },

    async createTask(params) {
      const api = `${config.api.protocol}://${config.api.host}:${config.api.port}/${config.api.base}`;

      try {
        const obj = model.clean(params, whitelists);
        const res = await axios.post(`${api}/${config.api.endPoints.tasks}/`, obj);
        this.task = res.data.data;
      } catch (err) {
        console.log(err);
      }
    },

    async updateTask(params) {
      const api = `${config.api.protocol}://${config.api.host}:${config.api.port}/${config.api.base}`;

      try {
        const obj = model.clean(this.task, whitelists);
        const res = await axios.put(`${api}/${config.api.endPoints.tasks}/${params.id}`, obj);
        assign(this.task, res.data.data);
      } catch (err) {
        console.log(err);
      }
    },

    async deleteTask(params) {
      const api = `${config.api.protocol}://${config.api.host}:${config.api.port}/${config.api.base}`;

      try {
        await axios.delete(`${api}/${config.api.endPoints.tasks}/${params.id}`);
        this.resetTask();
      } catch (err) {
        console.log(err);
      }
    },

    resetTask() {
      this.task = {
        title: '',
        description: '',
      };
    },
  },
});

/**
 * Exports.
 */
export default useTasksStore;
