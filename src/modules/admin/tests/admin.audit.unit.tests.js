import { describe, it, expect } from 'vitest';
import { isAuditOn } from '../lib/admin.audit';

describe('admin.audit — isAuditOn', () => {
  it('is false only when the server config reports audit.enabled === false', () => {
    expect(isAuditOn({ audit: { enabled: false } })).toBe(false);
  });

  it('is true when audit is on, the key is missing, or the config is not loaded', () => {
    expect(isAuditOn({ audit: { enabled: true } })).toBe(true);
    expect(isAuditOn({})).toBe(true);
    expect(isAuditOn(null)).toBe(true);
    expect(isAuditOn(undefined)).toBe(true);
  });
});
