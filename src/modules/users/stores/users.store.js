/**
 * Module dependencies.
 */
import { defineStore } from 'pinia';
import axios from '../../../lib/services/axios';
import config from '../../../lib/services/config';

/**
 * @desc Build the base API URL from config.
 * @returns {string} Base API URL
 */
const apiBase = () => `${config.api.protocol}://${config.api.host}:${config.api.port}/${config.api.base}`;

/**
 * Store definition.
 *
 * Owns the current user's self-service profile actions (update, delete
 * account) — previously called directly from `user.profile.view.vue` via a
 * raw `axios` import + inline URL building. Views should call these actions
 * instead of reaching into `lib/services/axios` themselves (UI → Store → API
 * layering).
 */
export const useUsersStore = defineStore('users', {
  actions: {
    /**
     * @desc Persist updated profile fields for the current user.
     * @param {{ firstName: string, lastName: string, bio: string, position: string }} formData
     * @returns {Promise<Object>} Resolved updated user data
     */
    async updateProfile(formData) {
      try {
        const res = await axios.put(`${apiBase()}/users`, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          bio: formData.bio,
          position: formData.position,
        });
        return res.data.data;
      } catch (err) {
        console.error(err);
        throw err;
      }
    },

    /**
     * @desc Permanently delete the current user's account.
     * @returns {Promise<void>}
     */
    async deleteAccount() {
      try {
        await axios.delete(`${apiBase()}/users`);
      } catch (err) {
        console.error(err);
        throw err;
      }
    },
  },
});

/**
 * Exports.
 */
export default useUsersStore;
