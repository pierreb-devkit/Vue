import config from '../../config/index.js';

/**
 * @desc Get the Vuetify color token for a given role.
 * @param {string} role
 * @returns {string} Vuetify color name
 */
const roleColor = (role) => {
  const colors = config.vuetify?.theme?.roles || { owner: 'error', admin: 'warning' };
  return colors[role] || 'info';
};

export default roleColor;
