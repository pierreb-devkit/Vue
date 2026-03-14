/**
 * @desc Generate a deterministic color for an organization based on its name.
 * @param {Object|string} org - Organization object (with name) or string
 * @returns {string} A hex color from the palette
 */
const palette = [
  '#1abc9c', '#2ecc71', '#3498db', '#9b59b6', '#e67e22',
  '#e74c3c', '#1e90ff', '#ff6348', '#a55eea', '#0abde3',
  '#10ac84', '#ee5a24',
];

const orgColor = (org) => {
  const name = String(typeof org === 'string' ? org : (org?.name || org?.slug || org?._id || org?.id || ''));
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
};

export default orgColor;
