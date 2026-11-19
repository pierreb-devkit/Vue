import { describe, it, expect, vi, beforeEach } from 'vitest';

const activeState = vi.hoisted(() => ({ active: true }));
vi.mock('../../../lib/helpers/modules', () => ({
  isModuleActive: (name) => (name === 'legal' ? activeState.active : true),
}));

/**
 * @desc Import a fresh copy of the legal entry and the shell registry it fills.
 * @returns {Promise<object>} The shell registry.
 */
const loadEntry = async () => {
  vi.resetModules();
  const shell = (await import('../../../lib/composables/useShellExtras')).useShellExtras();
  await import('../legal.app.js');
  return shell;
};

describe('legal.app.js entry', () => {
  beforeEach(() => {
    activeState.active = true;
  });

  it('registers the cookie banner and the footer section at the shell when legal is active', async () => {
    const shell = await loadEntry();
    expect(shell.extras.value.map((e) => e._id)).toEqual(['legal-cookie-banner', 'legal-footer-section']);
  });

  it('registers nothing when legal is switched off', async () => {
    activeState.active = false;
    const shell = await loadEntry();
    expect(shell.extras.value).toEqual([]);
  });
});
