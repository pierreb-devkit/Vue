/**
 * @desc Function to return actual theme
 * @param {String} option in config
 * @return {String} theme
 */
export const defineTheme = (theme) => {
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
export const isDark = (theme) => {
  if (theme === 'auto') {
    return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  }
  return !!theme;
};

/**
 * @desc Function to return custom css object
 * @param {String} String, section, card, video
 * @return {Object} object in config { background: ... }
 */
export const style = (kind, object) => {
  const style = {};
  if (object && object.style && object.style[kind]) {
    // background
    if (object.style[kind].background) {
      if (object.style[kind].background[0] === '#') style.background = object.style[kind].background;
      else if (object.style[kind].background.includes('linear-gradient')) style['background-image'] = object.style[kind].background;
      else style.background = `rgb(var(--v-theme-${object.style[kind].background})) !important`;
    }
    // color
    if (object.style[kind].color) {
      if (object.style[kind].color[0] === '#') style.color = object.style[kind].color;
      else style.color = `rgb(var(--v-theme-${object.style[kind].color})) !important`;
    }
    // height &  width
    if (object.style[kind].height) style.height = `${object.style[kind].height} !important`;
    if (object.style[kind].width) style.width = `${object.style[kind].width} !important`;
    // radius
    if (object.style[kind].borderRadius) style['border-radius'] = `${object.style[kind].borderRadius} !important`;
  }
  return style;
};

/**
 * Exports.
 */
export default { defineTheme, isDark, style };
