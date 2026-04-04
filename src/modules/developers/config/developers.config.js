/**
 * Developers module static configuration.
 */
export const supportedEvents = [
  { value: 'scrap.success', label: 'Scrap Success' },
  { value: 'scrap.failure', label: 'Scrap Failure' },
  { value: 'scrap.created', label: 'Scrap Created' },
  { value: 'scrap.deleted', label: 'Scrap Deleted' },
];

/**
 * @desc Map event names to chip colors.
 * @param {string} event - Event name
 * @returns {string} Vuetify color
 */
export function eventColor(event) {
  const map = {
    'scrap.success': 'success',
    'scrap.failure': 'error',
    'scrap.created': 'info',
    'scrap.deleted': 'warning',
  };
  return map[event] || 'default';
}

export default {
  supportedEvents,
  eventColor,
};
