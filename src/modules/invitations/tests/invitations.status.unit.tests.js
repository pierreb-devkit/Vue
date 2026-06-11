import { describe, it, expect } from 'vitest';
import { inviteStatus } from '../lib/invitations.status';

describe('invitations.status — shared 4-state derivation', () => {
  it('accepted wins over everything (usedAt or status)', () => {
    expect(inviteStatus({ usedAt: '2026-01-01', revokedAt: '2026-02-01', expiresAt: '2000-01-01' }).label).toBe('Accepted');
    expect(inviteStatus({ status: 'accepted' }).label).toBe('Accepted');
  });
  it('revoked wins over expiry (revokedAt or status)', () => {
    expect(inviteStatus({ revokedAt: '2026-01-01', expiresAt: '2000-01-01' }).label).toBe('Revoked');
    expect(inviteStatus({ status: 'revoked', expiresAt: '2999-01-01' }).label).toBe('Revoked');
  });
  it('expired then pending as before', () => {
    expect(inviteStatus({ expiresAt: '2000-01-01' }).label).toBe('Expired');
    expect(inviteStatus({ expiresAt: '2999-01-01' }).label).toBe('Pending');
    expect(inviteStatus({}).label).toBe('Pending');
  });
});
