import { describe, it, expect, vi, beforeEach } from 'vitest';

const activeState = vi.hoisted(() => ({ active: true }));
vi.mock('../../../lib/helpers/modules', () => ({
  isModuleActive: (name) => (name === 'organizations' ? activeState.active : true),
}));

/**
 * @desc Import a fresh copy of the organizations entry and the registries it fills.
 * @returns {Promise<{ shell: object, steps: object }>}
 */
const loadEntry = async () => {
  vi.resetModules();
  const shell = (await import('../../../lib/composables/useShellExtras')).useShellExtras();
  const steps = (await import('../../../lib/composables/useSignupSteps')).useSignupSteps();
  await import('../organizations.app.js');
  return { shell, steps };
};

describe('organizations.app.js entry', () => {
  beforeEach(() => {
    activeState.active = true;
  });

  it('registers the shell parts and the sign-up setup step when organizations is active', async () => {
    const { shell, steps } = await loadEntry();
    expect(shell.extras.value.map((e) => e._id)).toEqual([
      'organizations-admin-pending-banner',
      'organizations-login-notices',
      'organizations-header-action',
    ]);
    expect(steps.extras.value.map((e) => e._id)).toEqual(['organizationSetup']);
  });

  it('registers nothing when organizations is switched off', async () => {
    activeState.active = false;
    const { shell, steps } = await loadEntry();
    expect(shell.extras.value).toEqual([]);
    expect(steps.extras.value).toEqual([]);
  });
});
