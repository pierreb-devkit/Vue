/**
 * @desc Pick a deterministic color for a string from a palette (same string, same color).
 * Shared by the organization and user avatars, which keep their own palettes.
 * @param {string} str - Input string (name, email, id).
 * @param {string[]} [colors] - Hex colors to pick from (default: the organization palette).
 * @returns {string} A hex color from the palette
 */
export const hashColor = (str, colors = palette) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

/** Organization avatar palette (the `hashColor` default). */
export const palette = [
  '#1abc9c', '#2ecc71', '#3498db', '#9b59b6', '#e67e22',
  '#e74c3c', '#1e90ff', '#ff6348', '#a55eea', '#0abde3',
  '#10ac84', '#ee5a24',
];

/** User avatar palette (picked by email hash). */
export const userPalette = [
  '#1E88E5', '#43A047', '#E53935', '#8E24AA', '#FB8C00',
  '#00ACC1', '#3949AB', '#D81B60', '#7CB342', '#6D4C41',
  '#5E35B1', '#039BE5', '#C0CA33', '#F4511E', '#00897B',
  '#FFB300',
];

/**
 * @desc Relative luminance of a colour per WCAG 2.x (linearised sRGB channels).
 * @param {string} hex - Six-digit hex color code.
 * @returns {number} Luminance from 0 (black) to 1 (white).
 */
const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/**
 * @desc Text colour class that stays readable on an avatar colour: black or
 * white, whichever has the higher WCAG contrast ratio against it.
 * @param {string} hex - Six-digit hex color code.
 * @returns {'text-black'|'text-white'} Vuetify text colour class.
 */
export const avatarTextClass = (hex) => {
  const l = luminance(hex);
  const onBlack = (l + 0.05) / 0.05;
  const onWhite = 1.05 / (l + 0.05);
  return onBlack > onWhite ? 'text-black' : 'text-white';
};

/**
 * @desc Generate a deterministic color for an organization based on its name.
 * @param {Object|string} org - Organization object (with name) or string
 * @returns {string} A hex color from the palette
 */
const orgColor = (org) => hashColor(String(typeof org === 'string' ? org : (org?.name || org?.slug || org?._id || org?.id || '')));

export default orgColor;
