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
 * @desc Helper to convert hex color to RGB string
 * @param {String} hex - Hex color (e.g. #RRGGBB)
 * @return {String} RGB string (e.g. "255,255,255")
 */
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}` : '255,255,255';
};

/**
 * @desc Helper to adjust brightness of a hex color
 * @param {String} hex - Hex color (e.g. #RRGGBB)
 * @param {Number} amount - Amount to adjust (-1 to 1, negative = darker, positive = lighter)
 * @return {String} RGB string with adjusted brightness
 */
const adjustBrightness = (hex, amount) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '128,128,128';

  let r = parseInt(result[1], 16);
  let g = parseInt(result[2], 16);
  let b = parseInt(result[3], 16);

  // amount: -1 to 1
  // positive = blend towards white (lighter)
  // negative = blend towards black (darker)
  if (amount > 0) {
    // Lighten: blend towards 255
    r = Math.round(r + (255 - r) * amount);
    g = Math.round(g + (255 - g) * amount);
    b = Math.round(b + (255 - b) * amount);
  } else if (amount < 0) {
    // Darken: blend towards 0
    const factor = 1 + amount; // amount is negative, so this reduces
    r = Math.round(r * factor);
    g = Math.round(g * factor);
    b = Math.round(b * factor);
  }

  return `${r},${g},${b}`;
};

/**
 * @desc Function to generate Liquid Glass effect style
 * Simple and effective glassmorphism with contrast-based refraction
 *
 * @param {Object} options - Configuration object
 * @param {String} options.theme - 'dark' or 'light'
 * @param {String} options.backgroundColor - Hex color for background (e.g. '#121212')
 * @param {String} options.surfaceColor - Hex color for surface/highlight (e.g. '#FFFFFF')
 * @param {Number} options.intensity - Intensity of the glass effect (0 = flat, 1 = strong). Default: 1
 * @param {Number} options.tint - Adjust background brightness to stand out (-1 = darker, 0 = base, 1 = lighter). Default: 0
 * @param {String} options.variant - 'card', 'pill', or 'header' for different border-radius
 * @param {String} options.border - 'all', 'bottom', 'top', or 'none'. Default: 'all'
 * @param {Object} options.extras - Additional CSS properties to merge
 * @return {Object} CSS style object with liquid glass effect
 */
export const liquidGlassStyle = ({
  theme,
  backgroundColor,
  surfaceColor,
  intensity = 1,
  tint = 0,
  variant = 'card',
  border: borderStyle = 'all',
  extras = {},
}) => {
  const dark = theme === 'dark';
  const surfaceRgb = hexToRgb(surfaceColor);

  // Intensity multiplier (0 = flat, 1 = strong)
  const i = Math.max(0, Math.min(1, intensity));

  // Tint adjustment (-1 to 1)
  const t = Math.max(-1, Math.min(1, tint));

  // === GLASS BASE ===
  // Adjust background color based on tint to make div stand out
  const bgRgb = adjustBrightness(backgroundColor, t);
  const baseOpacity = dark ? 0.25 : 0.35;

  // === BLUR & REFRACTION (the key to glass effect) ===
  const blur = Math.round(6 + i * 12); // 6px to 12px
  const saturate = Math.round(100 + i * 50); // 100% to 150%
  const contrast = Math.round(100 + i * 30); // 100% to 130% - THIS makes it look like glass

  // === HIGHLIGHT (simple top gradient) ===
  const highlightOpacity = i * (dark ? 0.16 : 0.12);

  // Build simple layered background
  const background = `
    linear-gradient(
      to bottom,
      rgba(${surfaceRgb}, ${highlightOpacity.toFixed(3)}) 0%,
      rgba(${surfaceRgb}, ${(highlightOpacity * 0.5).toFixed(3)}) 20%,
      rgba(${surfaceRgb}, 0) 50%,
      rgba(${bgRgb}, 0) 100%
    ),
    rgba(${bgRgb}, ${baseOpacity.toFixed(2)})
  `;

  const borderColor = `rgba(${surfaceRgb}, ${borderStyle !== 'all' ? 0.5 : 0.2})`;

  let border = 'none';
  let borderTop = undefined;
  let borderBottom = undefined;

  if (i > 0 && borderStyle !== 'none') {
    if (borderStyle === 'bottom') {
      borderBottom = `1px solid ${borderColor}`;
    } else if (borderStyle === 'top') {
      borderTop = `1px solid ${borderColor}`;
    } else {
      border = `1px solid ${borderColor}`;
    }
  }

  // Border radius based on variant
  const borderRadius = variant === 'pill' ? '9999px' : variant === 'header' ? '0' : '16px';

  const result = {
    background,
    border,
    borderRadius,
    '-webkit-backdrop-filter': `blur(${blur}px) saturate(${saturate}%) contrast(${contrast}%)`,
    'backdrop-filter': `blur(${blur}px) saturate(${saturate}%) contrast(${contrast}%)`,
    ...extras,
  };

  // Add specific borders if set
  if (borderTop) result.borderTop = borderTop;
  if (borderBottom) result.borderBottom = borderBottom;

  return result;
};

/**
 * Exports.
 */
export default { defineTheme, isDark, style, liquidGlassStyle };
