/**
 * Module dependencies.
 */
import _ from 'lodash';

/**
 * @desc Function to clean object (pick from model, remove null / undefined)
 * @param {Object} data
 * @param {[String]} model
 * @return {Object} result
 */
const clean = (data, model) => _.omitBy(_.pick(data, model), _.isNull);

/**
 * Exports.
 */
export default {
  clean,
};
