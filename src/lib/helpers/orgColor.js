/**
 * @desc Pick a deterministic color for a string from a palette (same string, same color).
 * Shared by the organization and user avatars.
 * @param {string} str - Input string (name, email, id).
 * @param {string[]} [colors] - Hex colors to pick from (default: the avatar palette).
 * @returns {string} A hex color from the palette
 */
export const hashColor = (str, colors = palette) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

/** Avatar palette, shared by organization and user avatars. */
export const palette = [
  '#1abc9c', '#2ecc71', '#3498db', '#9b59b6', '#e67e22',
  '#e74c3c', '#1e90ff', '#ff6348', '#a55eea', '#0abde3',
  '#10ac84', '#ee5a24',
];

/**
 * @desc Text colour class that stays readable on an avatar colour.
 * Uses relative luminance per WCAG 2.x: light backgrounds get dark text.
 * @param {string} hex - Six-digit hex color code.
 * @returns {'text-black'|'text-white'} Vuetify text colour class.
 */
export const avatarTextClass = (hex) => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.5 ? 'text-black' : 'text-white';
};

/**
 * @desc Generate a deterministic color for an organization based on its name.
 * @param {Object|string} org - Organization object (with name) or string
 * @returns {string} A hex color from the palette
 */
const orgColor = (org) => hashColor(String(typeof org === 'string' ? org : (org?.name || org?.slug || org?._id || org?.id || '')));

export default orgColor;
