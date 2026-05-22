/**
 * CASL ability helpers.
 */
import { createMongoAbility } from '@casl/ability';
import { ref } from 'vue';

/**
 * @desc Make a CASL ability reactive for Vue without Vue's `reactive()`.
 *       @casl/ability v7 freezes its internal rule structures, so a `reactive()`
 *       proxy over the frozen rules array throws a Proxy get-invariant TypeError on
 *       the first `.can()` call. Instead we track the ability's `updated` event with
 *       a ref, read inside `possibleRulesFor` (the path every can/cannot/relevantRuleFor
 *       call funnels through), so component computeds calling `ability.can()` re-run
 *       when rules change. Mirrors @casl/vue's internal reactiveAbility, which v3
 *       declares in its types but does not export at runtime.
 * @param {import('@casl/ability').MongoAbility} ability - CASL ability instance
 * @returns {import('@casl/ability').MongoAbility} the same instance, made reactive
 */
const toReactiveAbility = (ability) => {
  const trigger = ref(true);
  ability.on('updated', () => {
    trigger.value = !trigger.value;
  });
  const possibleRulesFor = ability.possibleRulesFor.bind(ability);
  ability.possibleRulesFor = (action, subjectType) => {
    void trigger.value; // reactive read — tracks ability updates in computeds
    return possibleRulesFor(action, subjectType);
  };
  ability.can = ability.can.bind(ability);
  ability.cannot = ability.cannot.bind(ability);
  return ability;
};

/**
 * @desc Reactive CASL ability instance initialised with an empty rule set.
 */
export const ability = toReactiveAbility(createMongoAbility([]));

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
