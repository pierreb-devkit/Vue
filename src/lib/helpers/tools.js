/**
 * @desc Function to evaluate numbers of release from last release
 * @param {String} 2.3.4
 * @return {String} 23
 */
exports.releasesNumber = (release) => {
  const numbers = release[0] === 'v' ? release.substr(1).split('.') : release.split('.'); // get numbers last release
  numbers.pop();
  numbers[0] = numbers[0] === '1' ? '1' : String(parseInt(numbers[0], 10) * 10); // calc aproximativly number of release
  return numbers;
};

/**
 * @desc Function generate pagniation request
 * @param {Int} page
 * @param {Int} perPage
 * @param {String} search
 * @return {String} server-items-length
 */
exports.pageRequest = (page, perPage, search) => {
  let request = `${page - 1}&${perPage}`;
  if (search && search !== '') request += `&${search}`;
  return request;
};

/**
 * @desc Function get a dynamic total count from dataTable
 * @param {Array} array of items
 * @param {Object} Object options from vuetify dataTable
 * @return {String} server-items-length
 */
exports.serverItemsLength = (items, options) =>
  items.length === options.itemsPerPage ? options.page * options.itemsPerPage + options.itemsPerPage : options.page * options.itemsPerPage;
