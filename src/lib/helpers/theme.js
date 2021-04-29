/**
 * @desc Function to return actual theme
 * @param {String} option in config
 * @return {String} theme
 */
exports.defineTheme = (theme) => {
  if (theme === 'auto') {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme ? 'dark' : 'light';
};

/**
 * @desc Function to return actual theme
 * @param {String} option in config
 * @return {Boolean} dark value
 */
exports.isDark = (theme) => {
  if (theme === 'auto') {
    return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  }
  return !!theme;
};
