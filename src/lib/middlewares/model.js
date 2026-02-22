/**
 * Module dependencies.
 */
import _ from 'lodash';

/**
 * @desc Function to clean object (pick from model, remove null values)
 * @param {Object} data - Source object to clean
 * @param {Array} model - Array of keys to pick from data
 * @returns {Object} Cleaned object with only model keys and non-null values
 */
const clean = (data, model) => _.omitBy(_.pick(data, model), _.isNull);

/**
 * Exports.
 */
export default {
  clean,
};
