import { describe, it, expect } from 'vitest';
import vuetify from '../vuetify';

describe('vuetify plugin', () => {
  it('exports a vuetify instance', () => {
    expect(vuetify).toBeDefined();
  });

  it('has an install method (valid Vue plugin)', () => {
    expect(typeof vuetify.install).toBe('function');
  });
});
