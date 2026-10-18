import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { captureRef, getRef, clearRef, REFERRAL_LS_KEY, REFERRAL_TTL_MS } from '../referral';
import referralPlugin from '../../plugins/referral';

/**
 * @desc Point window.location.search at the given query string.
 * @param {string} search - e.g. '?ref=abc'
 * @returns {void}
 */
const setSearch = (search) => window.history.replaceState({}, '', `/${search}`);

describe('referral helper', () => {
  beforeEach(() => {
    localStorage.clear();
    setSearch('');
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('captures ?ref= from the landing URL', () => {
    setSearch('?ref=AbC_-123456789xy');
    captureRef();
    expect(getRef()).toBe('AbC_-123456789xy');
  });

  it('captures nothing without a valid ref', () => {
    captureRef();
    setSearch('?ref=bad code!');
    captureRef();
    setSearch('?ref=');
    captureRef();
    expect(getRef()).toBeNull();
    expect(localStorage.getItem(REFERRAL_LS_KEY)).toBeNull();
  });

  it('the last link clicked wins', () => {
    setSearch('?ref=first');
    captureRef();
    setSearch('?ref=second');
    captureRef();
    expect(getRef()).toBe('second');
  });

  it('expires after the TTL and clears the record', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    setSearch('?ref=abc');
    captureRef();
    vi.setSystemTime(new Date(Date.now() + REFERRAL_TTL_MS - 1000));
    expect(getRef()).toBe('abc');
    vi.setSystemTime(new Date(Date.now() + 2000));
    expect(getRef()).toBeNull();
    expect(localStorage.getItem(REFERRAL_LS_KEY)).toBeNull();
  });

  it('clearRef removes the code', () => {
    setSearch('?ref=abc');
    captureRef();
    clearRef();
    expect(getRef()).toBeNull();
  });

  it('drops a malformed stored record', () => {
    localStorage.setItem(REFERRAL_LS_KEY, '{not json');
    expect(getRef()).toBeNull();
    expect(localStorage.getItem(REFERRAL_LS_KEY)).toBeNull();
  });

  it('never throws when storage is unavailable', () => {
    const blocked = () => { throw new Error('blocked'); };
    vi.stubGlobal('localStorage', { getItem: blocked, setItem: blocked, removeItem: blocked });
    setSearch('?ref=abc');
    expect(() => captureRef()).not.toThrow();
    expect(getRef()).toBeNull();
  });

  it('the plugin captures on install', () => {
    setSearch('?ref=viaPlugin');
    referralPlugin.install({});
    expect(getRef()).toBe('viaPlugin');
  });
});
