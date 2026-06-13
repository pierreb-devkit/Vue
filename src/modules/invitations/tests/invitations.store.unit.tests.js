import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useInvitationsStore } from '../stores/invitations.store';
import axios from '../../../lib/services/axios';
import { capture } from '../../../lib/helpers/analytics';

// Mock axios
vi.mock('../../../lib/services/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock config
vi.mock('../../../lib/services/config', () => ({
  default: {
    api: { protocol: 'http', host: 'localhost', port: '3000', base: 'api' },
    cookie: { prefix: 'devkit' },
  },
}));

// Mock analytics so the PostHog re-emit can be asserted without a live SDK.
vi.mock('../../../lib/helpers/analytics', () => ({
  capture: vi.fn(),
}));

describe('invitations store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    axios.get.mockReset();
    axios.post.mockReset();
    axios.delete.mockReset();
    capture.mockReset();
  });

  it('initializes with empty state', () => {
    const store = useInvitationsStore();
    expect(store.invitations).toEqual([]);
    expect(store.error).toBeNull();
  });

  // ── Canonical mount: all actions hit /api/invitations (NOT /api/auth/invitations) ──

  it('getInvitations loads the list from the canonical /api/invitations mount', async () => {
    const store = useInvitationsStore();
    axios.get.mockResolvedValueOnce({ data: { data: [{ id: '1', email: 'a@b.co', usedAt: null }] } });
    await store.getInvitations();
    expect(axios.get).toHaveBeenCalledWith(expect.stringMatching(/\/api\/invitations$/));
    // Must NOT use the deprecated auth alias.
    expect(axios.get).not.toHaveBeenCalledWith(expect.stringMatching(/\/auth\/invitations/));
    expect(store.invitations).toEqual([{ id: '1', email: 'a@b.co', usedAt: null }]);
  });

  it('createInvitation POSTs to /api/invitations and returns the created invite', async () => {
    const store = useInvitationsStore();
    axios.post.mockResolvedValueOnce({ data: { data: { id: '2', email: 'new@b.co' } } });
    const result = await store.createInvitation('new@b.co');
    expect(axios.post).toHaveBeenCalledWith(expect.stringMatching(/\/api\/invitations$/), { email: 'new@b.co' });
    expect(axios.post).not.toHaveBeenCalledWith(expect.stringMatching(/\/auth\/invitations/), expect.anything());
    expect(result).toEqual({ id: '2', email: 'new@b.co' });
  });

  it('deleteInvitation DELETEs /api/invitations/:id by id', async () => {
    const store = useInvitationsStore();
    axios.delete.mockResolvedValueOnce({ data: { data: { id: '3' } } });
    await store.deleteInvitation('3');
    expect(axios.delete).toHaveBeenCalledWith(expect.stringMatching(/\/api\/invitations\/3$/));
    expect(axios.delete).not.toHaveBeenCalledWith(expect.stringMatching(/\/auth\/invitations/));
  });

  // ── PostHog funnel parity (re-emit invitation_created on platform create) ──

  it('createInvitation re-emits the invitation_created analytics event', async () => {
    const store = useInvitationsStore();
    axios.post.mockResolvedValueOnce({ data: { data: { id: '5', email: 'z@b.co' } } });
    await store.createInvitation('z@b.co');
    expect(capture).toHaveBeenCalledWith('invitation_created', { source: 'platform' });
  });

  it('createInvitation does NOT emit analytics when the request fails', async () => {
    const store = useInvitationsStore();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    axios.post.mockRejectedValueOnce(new Error('Server error'));
    await expect(store.createInvitation('fail@b.co')).rejects.toThrow('Server error');
    expect(capture).not.toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  // ── Error handling (sanitized message, state reset, rethrow semantics) ──

  it('getInvitations resets the list and sets a sanitized error on API failure', async () => {
    const store = useInvitationsStore();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    store.invitations = [{ id: 'stale' }];
    axios.get.mockRejectedValueOnce(new Error('Network error'));
    await store.getInvitations();
    expect(store.invitations).toEqual([]);
    expect(store.error).toBe('Failed to load data. Please try again.');
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('createInvitation sets error state and rethrows on API failure', async () => {
    const store = useInvitationsStore();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    axios.post.mockRejectedValueOnce(new Error('Server error'));
    await expect(store.createInvitation('fail@b.co')).rejects.toThrow('Server error');
    expect(store.error).toBe('Failed to load data. Please try again.');
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('deleteInvitation sets error state and rethrows on API failure', async () => {
    const store = useInvitationsStore();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    axios.delete.mockRejectedValueOnce(new Error('Forbidden'));
    await expect(store.deleteInvitation('99')).rejects.toThrow('Forbidden');
    expect(store.error).toBe('Failed to load data. Please try again.');
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('surfaces a safe API message when the backend returns a clean one', async () => {
    const store = useInvitationsStore();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    axios.get.mockRejectedValueOnce({ response: { data: { message: 'You are not allowed to invite users.' } } });
    await store.getInvitations();
    expect(store.error).toBe('You are not allowed to invite users.');
    consoleErrorSpy.mockRestore();
  });

  it('does NOT leak internal error details (stack/db paths) in the surfaced message', async () => {
    const store = useInvitationsStore();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    axios.get.mockRejectedValueOnce({ response: { data: { message: 'Error: at /app/modules/invitations/x.js:42 collection invitations' } } });
    await store.getInvitations();
    expect(store.error).toBe('Failed to load data. Please try again.');
    consoleErrorSpy.mockRestore();
  });

  // ── #3834 invitation ops: resend + the one-time token contract ──

  it('createInvitation returns the created invite INCLUDING the one-time token (copy-link source)', async () => {
    const store = useInvitationsStore();
    axios.post.mockResolvedValueOnce({ data: { data: { id: '2', email: 'new@b.co', token: 'tok-abc' } } });
    const result = await store.createInvitation('new@b.co');
    // The list endpoint strips tokens server-side — the create response is the
    // ONLY place a /signup?inviteToken= link can ever be built from.
    expect(result.token).toBe('tok-abc');
  });

  it('resendInvitation POSTs to /api/invitations/:id/resend and returns the invitation', async () => {
    const store = useInvitationsStore();
    axios.post.mockResolvedValueOnce({ data: { data: { id: '4', email: 'a@b.co', status: 'pending' } } });
    const result = await store.resendInvitation('4');
    expect(axios.post).toHaveBeenCalledWith(expect.stringMatching(/\/api\/invitations\/4\/resend$/));
    expect(axios.post).not.toHaveBeenCalledWith(expect.stringMatching(/\/auth\/invitations/));
    expect(result).toEqual({ id: '4', email: 'a@b.co', status: 'pending' });
  });

  it('resendInvitation sets error state and rethrows on API failure', async () => {
    const store = useInvitationsStore();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    axios.post.mockRejectedValueOnce(new Error('Conflict'));
    await expect(store.resendInvitation('9')).rejects.toThrow('Conflict');
    expect(store.error).toBe('Failed to load data. Please try again.');
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});
