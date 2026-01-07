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
const whitelists = ['firstName', 'lastName', 'bio', 'position', 'email', 'avatar', 'roles'];

/**
 * Store definition.
 */
export const useUsersStore = defineStore('users', {
  state: () => ({
    user: {
      firstName: '',
      lastName: '',
      bio: '',
      position: '',
      email: '',
      avatar: '',
      roles: [],
      updated: '',
      created: '',
    },
    users: [],
  }),

  actions: {
    async getUsers(params) {
      const api = `${config.api.protocol}://${config.api.host}:${config.api.port}/${config.api.base}`;

      try {
        const res = await axios.get(`${api}/${config.api.endPoints.users}/page/${params}`);
        this.users = res.data.data;
      } catch (err) {
        console.log(err);
      }
    },

    async getUser(params) {
      const api = `${config.api.protocol}://${config.api.host}:${config.api.port}/${config.api.base}`;

      try {
        const res = await axios.get(`${api}/${config.api.endPoints.users}/${params.id}`);
        this.user = res.data.data;
      } catch (err) {
        console.log(err);
      }
    },

    async updateUser(params) {
      const api = `${config.api.protocol}://${config.api.host}:${config.api.port}/${config.api.base}`;

      try {
        const obj = model.clean(this.user, whitelists);
        const res = await axios.put(`${api}/${config.api.endPoints.users}/${params.id}`, obj);
        assign(this.user, res.data.data);
      } catch (err) {
        console.log(err);
      }
    },

    async deleteUser(params) {
      const api = `${config.api.protocol}://${config.api.host}:${config.api.port}/${config.api.base}`;

      try {
        await axios.delete(`${api}/${config.api.endPoints.users}/${params.id}`);
        this.resetUser();
      } catch (err) {
        console.log(err);
      }
    },

    resetUser() {
      this.user = {
        firstName: '',
        lastName: '',
        bio: '',
        position: '',
        email: '',
        avatar: '',
        roles: [],
        updated: '',
        created: '',
      };
    },

    // uploadAvatar: async (app, params) => {
    //   try {
    //     const config = app.config;
    //     const api = `${config.api.protocol}://${config.api.host}:${config.api.port}/${config.api.base}`;
    //     const formData = new FormData();
    //     formData.append('img', params.file);
    //     const res = await app.config.globalProperties.axios.post(
    //       `${api}/${config.api.endPoints...}/..../avatar/${params.id}`,
    //       formData,
    //       { headers: { 'Content-Type': 'multipart/form-data' } },
    //     );
    //     _.assign(this.user, res.data.data);
    //   } catch (err) {
    //     console.log(err);
    //   }
    // },
  },
});

/**
 * Exports.
 */
export default useUsersStore;
