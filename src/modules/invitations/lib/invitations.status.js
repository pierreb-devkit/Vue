/**
 * Shared invitation status derivation — single source of truth for the admin
 * view, the account view, and the account referral summary (they must never
 * disagree). Order matters:
 *   accepted (usedAt/status) > revoked (revokedAt/status, E8 soft-delete)
 *   > expired (expiresAt past) > pending.
 * Reads BOTH the lifecycle timestamps and the Node `status` enum so it stays
 * correct whichever the API populates.
 * @param {Object} item - invitation row from /api/invitations
 * @returns {{ label: 'Accepted'|'Revoked'|'Expired'|'Pending', color: string }}
 */
export const inviteStatus = (item) => {
  if (item.usedAt || item.status === 'accepted') return { label: 'Accepted', color: 'success' };
  // Neutral chip: a revoked invite is an inert historical row, not an error state.
  if (item.revokedAt || item.status === 'revoked') return { label: 'Revoked', color: '' };
  if (item.expiresAt && new Date(item.expiresAt).getTime() < Date.now()) return { label: 'Expired', color: 'error' };
  return { label: 'Pending', color: 'warning' };
};

export default { inviteStatus };
