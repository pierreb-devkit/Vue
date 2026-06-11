import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { shallowMount } from '@vue/test-utils';
import { useInvitationsStore } from '../stores/invitations.store';
import InvitationsAccount from '../views/invitations.account.view.vue';

vi.mock('../../../lib/services/axios', () => ({ default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() } }));
vi.mock('../../../lib/services/config', () => ({
  default: {
    api: { protocol: 'http', host: 'localhost', port: '3000', base: 'api' },
    vuetify: { theme: { flat: true, rounded: 'rounded-lg' } },
  },
}));

const stubs = {
  // Render the #status slot so the chip template function is invoked
  coreDataTableComponent: {
    template: `<div><slot name="status" :item="{ id:'s1', email:'a@b.co', usedAt: null, expiresAt: '2999-01-01' }" /></div>`,
  },
  'v-container': { template: '<div><slot /></div>' },
  'v-row': { template: '<div><slot /></div>' },
  'v-col': { template: '<div><slot /></div>' },
  'v-btn': { template: '<button @click="$emit(\'click\')"><slot /></button>', emits: ['click'] },
  'v-card': { template: '<div><slot /></div>' },
  'v-alert': { template: '<div class="v-alert"><slot /><button class="alert-close" @click="$emit(\'click:close\')"></button></div>', emits: ['click:close'] },
  'v-text-field': { template: '<input class="vtext-field" @input="$emit(\'update:modelValue\', $event.target.value)" />', emits: ['update:modelValue'], props: ['rules', 'modelValue'] },
  'v-form': { template: '<form @submit.prevent="$emit(\'update:modelValue\', true)"><slot /></form>', emits: ['update:modelValue'], props: ['modelValue'] },
  'v-chip': { template: '<span><slot /></span>' },
  'v-icon': { template: '<i />' },
};

/**
 * Mount InvitationsAccount in shallow mode with shared stubs.
 * @returns {import('@vue/test-utils').VueWrapper} Mounted component wrapper.
 */
const mountView = () =>
  shallowMount(InvitationsAccount, {
    global: {
      mocks: { config: { vuetify: { theme: { flat: true, rounded: 'rounded-lg' } } } },
      stubs,
    },
  });

describe('invitations.account.view', () => {
  let store;
  beforeEach(() => {
    setActivePinia(createPinia());
    store = useInvitationsStore();
    store.getInvitations = vi.fn().mockResolvedValue();
    store.createInvitation = vi.fn().mockResolvedValue({ id: '9', email: 'x@y.co' });
  });

  it('exposes invitations from the invitations store', () => {
    store.invitations = [{ id: '1', email: 'a@b.co', usedAt: null, expiresAt: null }];
    const wrapper = mountView();
    expect(wrapper.vm.invitations).toEqual([{ id: '1', email: 'a@b.co', usedAt: null, expiresAt: null }]);
  });

  it('exposes the store error (surfaced as a banner)', () => {
    store.error = 'boom';
    const wrapper = mountView();
    expect(wrapper.vm.error).toBe('boom');
  });

  it('fetchInvitations delegates to the store', async () => {
    const wrapper = mountView();
    await wrapper.vm.fetchInvitations();
    expect(store.getInvitations).toHaveBeenCalled();
  });

  it('inviteStatus derives Accepted / Expired / Pending', () => {
    const wrapper = mountView();
    expect(wrapper.vm.inviteStatus({ usedAt: '2026-01-01' }).label).toBe('Accepted');
    expect(wrapper.vm.inviteStatus({ usedAt: null, expiresAt: '2000-01-01' }).label).toBe('Expired');
    expect(wrapper.vm.inviteStatus({ usedAt: null, expiresAt: '2999-01-01' }).label).toBe('Pending');
  });

  it('inviteStatus derives Revoked (revokedAt or status) ahead of expiry', () => {
    const wrapper = mountView();
    expect(wrapper.vm.inviteStatus({ revokedAt: '2026-01-01', expiresAt: '2000-01-01' }).label).toBe('Revoked');
    expect(wrapper.vm.inviteStatus({ status: 'revoked' }).label).toBe('Revoked');
  });

  it('submitInvite no-ops when the form is invalid', async () => {
    const wrapper = mountView();
    wrapper.vm.inviteForm.valid = false;
    wrapper.vm.inviteForm.email = 'whatever@b.co';
    await wrapper.vm.submitInvite();
    expect(store.createInvitation).not.toHaveBeenCalled();
  });

  it('submitInvite (valid) creates the invite, resets the email, refreshes the list', async () => {
    const wrapper = mountView();
    wrapper.vm.inviteForm.valid = true;
    wrapper.vm.inviteForm.email = 'new@b.co';
    await wrapper.vm.submitInvite();
    expect(store.createInvitation).toHaveBeenCalledWith('new@b.co');
    expect(store.getInvitations).toHaveBeenCalled();
    expect(wrapper.vm.inviteForm.email).toBe('');
    expect(wrapper.vm.inviteForm.loading).toBe(false);
  });

  it('submitInvite error path: loading ends false, email NOT reset, no throw', async () => {
    store.createInvitation = vi.fn().mockRejectedValue(new Error('Server error'));
    const wrapper = mountView();
    wrapper.vm.inviteForm.valid = true;
    wrapper.vm.inviteForm.email = 'fail@b.co';
    await expect(wrapper.vm.submitInvite()).resolves.toBeUndefined();
    expect(wrapper.vm.inviteForm.loading).toBe(false);
    // create threw before the email reset → email is preserved so the user can retry
    expect(wrapper.vm.inviteForm.email).toBe('fail@b.co');
    expect(store.getInvitations).not.toHaveBeenCalled();
  });

  it('clearError nulls the store error', () => {
    store.error = 'oops';
    const wrapper = mountView();
    wrapper.vm.clearError();
    expect(store.error).toBeNull();
  });

  it('rules.required returns true for a value, error string for empty', () => {
    const wrapper = mountView();
    expect(wrapper.vm.rules.required('x')).toBe(true);
    expect(wrapper.vm.rules.required('')).toBe('Required');
  });

  it('rules.mail returns true for a valid email, error string for garbage', () => {
    const wrapper = mountView();
    expect(wrapper.vm.rules.mail('user@example.com')).toBe(true);
    expect(wrapper.vm.rules.mail('not-an-email')).toBe('E-mail must be valid');
  });

  it('referralSummary derives counts by status from a mixed list', () => {
    store.invitations = [
      { id: '1', usedAt: '2026-01-01', expiresAt: '2999-01-01' }, // joined
      { id: '2', usedAt: '2026-02-01', expiresAt: '2000-01-01' }, // joined (usedAt wins over expiry)
      { id: '3', usedAt: null, expiresAt: '2000-01-01' }, // expired
      { id: '4', usedAt: null, expiresAt: '2999-01-01' }, // pending
      { id: '5', usedAt: null, revokedAt: '2026-03-01', expiresAt: '2999-01-01' }, // revoked — NOT pending
    ];
    const wrapper = mountView();
    expect(wrapper.vm.referralSummary).toEqual({ total: 5, joined: 2, pending: 1, expired: 1, revoked: 1 });
    expect(wrapper.vm.referralSummary.revoked).toBe(1);
    expect(wrapper.vm.referralSummary.pending).toBe(1);
  });

  it('referralSummary on an empty list is all zeros', () => {
    store.invitations = [];
    const wrapper = mountView();
    expect(wrapper.vm.referralSummary).toEqual({ total: 0, joined: 0, pending: 0, expired: 0, revoked: 0 });
  });

  it('renders the My referrals summary chips (expired chip hidden at zero)', () => {
    store.invitations = [
      { id: '1', usedAt: '2026-01-01', expiresAt: '2999-01-01' },
      { id: '2', usedAt: null, expiresAt: '2999-01-01' },
      { id: '3', usedAt: null, expiresAt: '2999-01-01' },
    ];
    const wrapper = mountView();
    expect(wrapper.text()).toContain('My referrals');
    const summary = wrapper.find('[data-test="referrals-summary"]');
    expect(summary.exists()).toBe(true);
    expect(summary.text()).toContain('3 invited');
    expect(summary.text()).toContain('1 joined');
    expect(summary.text()).toContain('2 pending');
    expect(summary.text()).not.toContain('expired');
  });

  it('renders the expired chip when expired invitations exist', () => {
    store.invitations = [{ id: '1', usedAt: null, expiresAt: '2000-01-01' }];
    const wrapper = mountView();
    expect(wrapper.find('[data-test="referrals-summary"]').text()).toContain('1 expired');
  });

  it('renders the referral-rewards placeholder — honest, no numbers', () => {
    const wrapper = mountView();
    const placeholder = wrapper.find('[data-test="referral-rewards-placeholder"]');
    expect(placeholder.exists()).toBe(true);
    expect(placeholder.text()).toContain('Referral rewards — coming soon');
    // Scaffold contract (#5 not built): the placeholder must never show numbers/fake math
    expect(placeholder.text()).not.toMatch(/\d/);
  });
});
