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
