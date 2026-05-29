/**
 * Tools helpers.
 */

/**
 * @desc Function generate pagniation request
 * @param {Int} page
 * @param {Int} perPage
 * @param {String} search
 * @returns {String} Pagination request string
 */
export const pageRequest = (page, perPage, search) => {
  let request = `${page - 1}&${perPage}`;
  if (search && search !== '') request += `&${search}`;
  return request;
};

/**
 * @desc Function get a dynamic total count from dataTable
 * @param {Array} items - Array of items from the current page
 * @param {Object} options - Options object from Vuetify dataTable
 * @returns {number} server items length
 */
export const serverItemsLength = (items, options) =>
  items.length === options.itemsPerPage ? options.page * options.itemsPerPage + options.itemsPerPage : options.page * options.itemsPerPage;

/**
 * Exports.
 */
export default { pageRequest, serverItemsLength };
