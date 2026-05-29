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
 * @desc Build the base API URL from config.
 * @returns {string} Base API URL
 */
const apiBase = () => `${config.api.protocol}://${config.api.host}:${config.api.port}/${config.api.base}`;

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
    /**
     * @desc Fetch all tasks.
     * @returns {Promise<Array>} Resolved list of tasks
     */
    async getTasks() {
      const api = apiBase();
      const res = await axios.get(`${api}/${config.api.endPoints.tasks}/`);
      this.tasks = res.data.data;
      return this.tasks;
    },

    /**
     * @desc Fetch a single task by ID.
     * @param {Object} params - Request params
     * @param {string} params.id - Task ID
     * @returns {Promise<Object>} Resolved task object
     */
    async getTask(params) {
      const api = apiBase();
      const res = await axios.get(`${api}/${config.api.endPoints.tasks}/${params.id}`);
      this.task = res.data.data;
      return this.task;
    },

    /**
     * @desc Create a new task.
     * @param {Object} params - Task data
     * @returns {Promise<Object>} Resolved created task
     */
    async createTask(params) {
      const api = apiBase();
      const obj = model.clean(params, whitelists);
      const res = await axios.post(`${api}/${config.api.endPoints.tasks}/`, obj);
      this.task = res.data.data;
      return this.task;
    },

    /**
     * @desc Update an existing task.
     * @param {Object} params - Request params
     * @param {string} params.id - Task ID
     * @returns {Promise<Object>} Resolved updated task
     */
    async updateTask(params) {
      const api = apiBase();
      const obj = model.clean(this.task, whitelists);
      const res = await axios.put(`${api}/${config.api.endPoints.tasks}/${params.id}`, obj);
      assign(this.task, res.data.data);
      return this.task;
    },

    /**
     * @desc Delete a task by ID.
     * @param {Object} params - Request params
     * @param {string} params.id - Task ID
     * @returns {Promise<void>}
     */
    async deleteTask(params) {
      const api = apiBase();
      await axios.delete(`${api}/${config.api.endPoints.tasks}/${params.id}`);
      this.resetTask();
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
