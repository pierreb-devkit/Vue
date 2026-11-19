/**
 * Shared Vuetify form rules. Each factory returns a rule `(value) => true | message`;
 * the optional argument overrides the default message.
 *
 * USAGE:
 *   rules: { required: required(), mail: email(), password: required('Password is required') }
 */

const EMAIL_PATTERN = /\S+@\S+\.\S+/;

/**
 * @desc Whether a value looks like an e-mail address (the test behind the `email` rule).
 * @param {*} v - Value to test.
 * @returns {boolean} True when the value matches `x@y.z`.
 */
export const isEmail = (v) => EMAIL_PATTERN.test(v);

/**
 * @desc Rule: the value must be present (truthy).
 * @param {string} [message='Required'] - Message shown when the rule fails.
 * @returns {(value: *) => true|string} Vuetify rule.
 */
export const required = (message = 'Required') => (v) => !!v || message;

/**
 * @desc Rule: the value must be a string with at least one non-space character.
 * @param {string} [message='Required'] - Message shown when the rule fails.
 * @returns {(value: *) => true|string} Vuetify rule.
 */
export const requiredTrim = (message = 'Required') => (v) => (!!v && !!v.trim()) || message;

/**
 * @desc Rule: the value must look like an e-mail address.
 * @param {string} [message='E-mail must be valid'] - Message shown when the rule fails.
 * @returns {(value: *) => true|string} Vuetify rule.
 */
export const email = (message = 'E-mail must be valid') => (v) => isEmail(v) || message;
