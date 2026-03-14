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

const apiBase = () => `${config.api.protocol}://${config.api.host}:${config.api.port}/${config.api.base}`;

const defaultUser = () => ({
  firstName: '',
  lastName: '',
  bio: '',
  position: '',
  email: '',
  avatar: '',
  roles: [],
  memberships: [],
  updated: '',
  created: '',
});

/**
 * Store definition.
 */
export const useAdminStore = defineStore('admin', {
  state: () => ({
    user: defaultUser(),
    users: [],
    organizations: [],
  }),

  actions: {
    async getUsers(params) {
      try {
        const res = await axios.get(`${apiBase()}/admin/users/page/${params}`);
        this.users = res.data.data;
      } catch (err) {
        console.log(err);
      }
    },

    async getUser(params) {
      try {
        const res = await axios.get(`${apiBase()}/admin/users/${params.id}`);
        this.user = res.data.data;
      } catch (err) {
        console.log(err);
      }
    },

    async updateUser(params, formData) {
      try {
        const obj = model.clean({ ...this.user, ...formData }, whitelists);
        const res = await axios.put(`${apiBase()}/admin/users/${params.id}`, obj);
        assign(this.user, res.data.data);
      } catch (err) {
        console.log(err);
        throw err;
      }
    },

    async deleteUser(params) {
      try {
        await axios.delete(`${apiBase()}/admin/users/${params.id}`);
        this.resetUser();
      } catch (err) {
        console.log(err);
        throw err;
      }
    },

    resetUser() {
      this.user = defaultUser();
    },

    async getOrganizations(params) {
      try {
        const url = params ? `${apiBase()}/admin/organizations/page/${params}` : `${apiBase()}/admin/organizations`;
        const res = await axios.get(url);
        this.organizations = res.data.data;
      } catch (err) {
        console.log(err);
      }
    },
  },
});

/**
 * Exports.
 */
export default useAdminStore;
