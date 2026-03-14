import { describe, it, expect, vi } from 'vitest';

// Mock config — the path must match what roleColor.js imports
vi.mock('../../../config/index.js', () => ({
  default: {
    vuetify: {
      theme: {
        roles: { owner: 'error', admin: 'warning', editor: 'success' },
      },
    },
  },
}));

import roleColor from '../roleColor';

describe('roleColor Helper', () => {
  it('should return "error" for the owner role', () => {
    expect(roleColor('owner')).toBe('error');
  });

  it('should return "warning" for the admin role', () => {
    expect(roleColor('admin')).toBe('warning');
  });

  it('should return the configured color for custom roles', () => {
    expect(roleColor('editor')).toBe('success');
  });

  it('should return "info" as default for unknown roles', () => {
    expect(roleColor('member')).toBe('info');
  });

  it('should return "info" for undefined role', () => {
    expect(roleColor(undefined)).toBe('info');
  });

  it('should return "info" for empty string role', () => {
    expect(roleColor('')).toBe('info');
  });
});
