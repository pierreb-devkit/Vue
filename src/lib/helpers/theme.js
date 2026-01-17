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
 * @param {Number} amount - Amount to adjust (-1 to 1, or 0-100 for legacy percent mode)
 * @param {String} output - 'rgb' for RGB string, 'hex' for hex string. Default: 'rgb'
 * @return {String} RGB string (e.g. "255,255,255") or hex string (e.g. "#ffffff")
 */
const adjustColor = (hex, amount, output = 'rgb') => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return output === 'hex' ? '#808080' : '128,128,128';

  let r = parseInt(result[1], 16);
  let g = parseInt(result[2], 16);
  let b = parseInt(result[3], 16);

  // Normalize: if amount > 1 or < -1, treat as percentage (0-100)
  const normalized = Math.abs(amount) > 1 ? amount / 100 : amount;

  if (normalized > 0) {
    // Lighten: blend towards 255
    r = Math.round(r + (255 - r) * normalized);
    g = Math.round(g + (255 - g) * normalized);
    b = Math.round(b + (255 - b) * normalized);
  } else if (normalized < 0) {
    // Darken: blend towards 0
    const factor = 1 + normalized;
    r = Math.round(r * factor);
    g = Math.round(g * factor);
    b = Math.round(b * factor);
  }

  if (output === 'hex') {
    return `#${(0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1)}`;
  }
  return `${r},${g},${b}`;
};

/**
 * @desc Function to generate Liquid Glass effect style
 * Simple and effective glassmorphism with contrast-based refraction
 *
 * @param {Object} options - Configuration object
 * @param {Object} options.vuetifyTheme - Vuetify theme object (from useTheme()). Auto-extracts colors.
 * @param {Number} options.intensity - Intensity of the glass effect (0 = flat, 1 = strong). Default: 0.8
 * @param {String|Number} options.tint - 'auto' for smart tint, or number (-1 to 1). Default: 'auto'
 * @param {String} options.variant - 'card', 'pill', or 'header' for different border-radius. Default: 'card'
 * @param {String} options.border - 'all', 'bottom', 'top', or 'none'. Default: 'all'
 * @param {Boolean|String} options.glowBorder - false, true (static gradient), or 'animated' (rotating). Default: false
 * @param {Object} options.extras - Additional CSS properties to merge
 * @return {Object} CSS style object with liquid glass effect
 */
export const liquidGlassStyle = ({
  vuetifyTheme,
  intensity = 0.8,
  tint = 'auto',
  variant = 'card',
  border: borderStyle = 'all',
  glowBorder = false,
  extras = {},
}) => {
  // Auto-detect theme name and colors from Vuetify
  const themeName = vuetifyTheme.global?.name?.value || 'dark';
  const dark = themeName === 'dark';
  const backgroundColor = vuetifyTheme.current?.colors?.background || '#121212';
  const surfaceColor = vuetifyTheme.current?.colors?.surface || '#FFFFFF';
  const surfaceRgb = hexToRgb(surfaceColor);

  // Intensity multiplier (0 = flat, 1 = strong)
  const i = Math.max(0, Math.min(1, intensity));

  // Auto-tint: lighter for dark theme, darker for light theme
  const t = tint === 'auto' ? (dark ? 0.3 : -0.2) : Math.max(-1, Math.min(1, tint));

  // === GLASS BASE ===
  // Adjust background color based on tint to make div stand out
  const bgRgb = adjustColor(backgroundColor, t);
  const baseOpacity = dark ? 0.25 : 0.45; // More opaque in light mode for visibility

  // === BLUR & REFRACTION (the key to glass effect) ===
  const blur = Math.round(6 + i * 12); // 6px to 18px
  const saturate = Math.round(100 + i * 50); // 100% to 150%
  const contrast = Math.round(100 + i * 30); // 100% to 130%

  // === HIGHLIGHT (simple top gradient) - stronger in light mode ===
  const highlightOpacity = i * (dark ? 0.16 : 0.25);

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

  // === BORDER - use dark border in light mode for contrast ===
  const borderOpacity = dark ? 0.2 : 0.12;
  const borderColor = dark ? `rgba(${surfaceRgb}, ${borderOpacity})` : `rgba(0, 0, 0, ${borderOpacity})`;

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

  // === BOX SHADOW - key for light mode depth ===
  let boxShadow;
  if (dark) {
    // Subtle inner glow for dark mode
    boxShadow = i > 0 ? `inset 0 1px 1px rgba(255, 255, 255, ${(i * 0.1).toFixed(2)})` : 'none';
  } else {
    // Layered shadow for light mode - creates depth on white backgrounds
    boxShadow =
      i > 0
        ? `0 2px 8px rgba(0, 0, 0, ${(i * 0.06).toFixed(2)}), 0 8px 24px rgba(0, 0, 0, ${(i * 0.04).toFixed(2)}), inset 0 1px 1px rgba(255, 255, 255, ${(i * 0.8).toFixed(2)})`
        : 'none';
  }

  // Border radius based on variant
  const borderRadius = variant === 'pill' ? '9999px' : variant === 'header' ? '0' : '16px';

  const result = {
    background,
    border,
    borderRadius,
    boxShadow,
    '-webkit-backdrop-filter': `blur(${blur}px) saturate(${saturate}%) contrast(${contrast}%)`,
    'backdrop-filter': `blur(${blur}px) saturate(${saturate}%) contrast(${contrast}%)`,
    ...extras,
  };

  // Add specific borders if set
  if (borderTop) result.borderTop = borderTop;
  if (borderBottom) result.borderBottom = borderBottom;

  // Add glowBorder pseudo-element styles via CSS custom properties
  if (glowBorder) {
    result['--glow-border'] = '1';
    result['--glow-border-radius'] = borderRadius;
    result['--glow-rotation'] = glowBorder === 'animated' ? 'var(--gradient-rotation, 135deg)' : '135deg';
  }

  return result;
};

/**
 * @desc Generate overlap style for container (slides up into previous section)
 * @param {Boolean|String|Object} overlap - true (defaults), string ('30vh'), or { mobile: '20vh', desktop: '40vh' }
 * @param {Object} display - Vuetify display object ($vuetify.display)
 * @return {Object} Style object with margin-top, position and z-index
 */
export const overlapStyle = (overlap, display) => {
  if (!overlap) return {};

  let marginTop;
  if (overlap === true) {
    marginTop = display?.smAndDown ? '-20vh' : '-40vh';
  } else if (typeof overlap === 'string') {
    marginTop = `-${overlap}`;
  } else if (typeof overlap === 'object') {
    marginTop = display?.smAndDown ? `-${overlap.mobile || '20vh'}` : `-${overlap.desktop || '40vh'}`;
  } else {
    return {};
  }

  return {
    'margin-top': marginTop,
    position: 'relative',
    'z-index': '10',
  };
};

/**
 * @desc Helper to lighten a hex color
 * @param {String} hex - Hex color (e.g. #RRGGBB)
 * @param {Number} percent - Percentage to lighten (0-100)
 * @return {String} Hex color string
 */
export const lightenColor = (hex, percent) => adjustColor(hex, percent, 'hex');

/**
 * Exports.
 */
export default { isDark, style, liquidGlassStyle, overlapStyle, lightenColor };
