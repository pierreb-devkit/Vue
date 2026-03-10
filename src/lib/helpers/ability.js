/**
 * CASL ability helpers.
 */
import { createMongoAbility } from '@casl/ability';
import { reactive } from 'vue';

/**
 * @desc Reactive CASL ability instance initialised with an empty rule set.
 *       Wrapping the instance with `reactive` keeps Vue templates in sync
 *       whenever the rules are updated.
 */
export const ability = reactive(createMongoAbility([]));

/**
 * @desc Replace the current ability rules with a new set received from the
 *       backend.  Passing an empty array clears all permissions.
 * @param {Array} rules - Array of CASL rule objects (e.g. `[{ action: 'read', subject: 'Article' }]`)
 * @returns {void}
 */
export const updateAbilities = (rules) => {
  ability.update(rules);
};

/**
 * Exports.
 */
export default { ability, updateAbilities };
