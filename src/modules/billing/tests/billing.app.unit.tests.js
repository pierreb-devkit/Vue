import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

const activeState = vi.hoisted(() => ({ active: true }));
vi.mock('../../../lib/helpers/modules', () => ({
  isModuleActive: (name) => (name === 'billing' ? activeState.active : true),
}));

/**
 * @desc Import a fresh copy of the billing entry (and the registries it fills),
 * as main.js does once at boot.
 * @returns {Promise<{ shell: object, hooks: object, entry: object }>}
 */
const loadEntry = async () => {
  vi.resetModules();
  const shell = (await import('../../../lib/composables/useShellExtras')).useShellExtras();
  const hooks = await import('../../../lib/helpers/signinHooks');
  const entry = await import('../billing.app.js');
  return { shell, hooks, entry };
};

describe('billing.app.js entry', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    activeState.active = true;
  });

  it('registers the nav extras and the meter alert at the shell when billing is active', async () => {
    const { shell } = await loadEntry();
    expect(shell.extras.value.map((e) => e._id)).toEqual(['billing-meter-alert', 'billing-nav-extras']);
  });

  it('registers nothing when billing is switched off', async () => {
    activeState.active = false;
    const { shell } = await loadEntry();
    expect(shell.extras.value).toEqual([]);
  });

  it('is idempotent: registering again keeps one entry per part', async () => {
    const { shell, entry } = await loadEntry();
    entry.register();
    expect(shell.extras.value).toHaveLength(2);
  });

  it('refreshMeterOnSignin fetches the meter only when meterMode is on', async () => {
    const { entry } = await loadEntry();
    const { useBillingStore } = await import('../stores/billing.store');
    const store = useBillingStore();
    const spy = vi.spyOn(store, 'fetchUsageMeter').mockResolvedValue();
    expect(entry.refreshMeterOnSignin({ serverConfig: { billing: { meterMode: false } } })).toBeUndefined();
    expect(entry.refreshMeterOnSignin({ serverConfig: null })).toBeUndefined();
    expect(spy).not.toHaveBeenCalled();
    await entry.refreshMeterOnSignin({ serverConfig: { billing: { meterMode: true } } });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('swallows a failed meter refresh (best-effort)', async () => {
    const { entry } = await loadEntry();
    const { useBillingStore } = await import('../stores/billing.store');
    vi.spyOn(useBillingStore(), 'fetchUsageMeter').mockRejectedValue(new Error('down'));
    await expect(entry.refreshMeterOnSignin({ serverConfig: { billing: { meterMode: true } } })).resolves.toBeUndefined();
  });

  it('runs the meter refresh through the sign-in hooks only when billing is active', async () => {
    const { hooks } = await loadEntry();
    const { useBillingStore } = await import('../stores/billing.store');
    const spy = vi.spyOn(useBillingStore(), 'fetchUsageMeter').mockResolvedValue();
    hooks.runSigninHooks({ serverConfig: { billing: { meterMode: true } }, user: null });
    expect(spy).toHaveBeenCalledTimes(1);

    activeState.active = false;
    const off = await loadEntry();
    const { useBillingStore: useFreshBillingStore } = await import('../stores/billing.store');
    const offSpy = vi.spyOn(useFreshBillingStore(), 'fetchUsageMeter').mockResolvedValue();
    offSpy.mockClear(); // same Pinia store across module resets: drop the call counted above
    off.hooks.runSigninHooks({ serverConfig: { billing: { meterMode: true } }, user: null });
    expect(offSpy).not.toHaveBeenCalled();
  });
});
