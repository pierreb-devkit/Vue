import { describe, test, expect } from 'vitest';

describe('users config – users.tabs', () => {
  test('users.tabs has Profile + Organizations descriptors in order', async () => {
    // Import via the generated config index so any future merges are covered.
    const config = (await import('../../../config/index.js')).default;
    expect(config.users.tabs).toEqual([
      { value: 'profile', label: 'Profile', icon: 'fa-solid fa-id-card', route: 'profile' },
      { value: 'organizations', label: 'Organizations', icon: 'fa-solid fa-building', route: 'organizations' },
    ]);
  });
});
