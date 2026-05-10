import { describe, it, expect } from 'vitest';
import plugins from '../index';

describe('plugins index', () => {
  it('exports an object', () => {
    expect(typeof plugins).toBe('object');
    expect(plugins).not.toBeNull();
  });

  const expectedPlugins = ['vuetify', 'posthog', 'dayjs', 'images', 'aos', 'markdown', 'lodash', 'i18n'];

  expectedPlugins.forEach((name) => {
    it(`exports ${name} plugin`, () => {
      expect(plugins[name]).toBeDefined();
    });

    it(`${name} has an install method`, () => {
      expect(typeof plugins[name].install).toBe('function');
    });
  });
});
