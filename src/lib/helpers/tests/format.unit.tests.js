/**
 * @fileoverview Unit tests for the shared display formats: each call site's
 * output must match the inline code it replaced.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LOCALE, formatDate, formatNumber, timeAgo } from '../format';

const NOW = new Date('2026-11-18T12:00:00Z');

describe('format helpers', () => {
  it('uses one fixed en-US locale', () => {
    expect(LOCALE).toBe('en-US');
  });

  describe('formatNumber', () => {
    it.each([0, 7, 1234, 1234567.5, null, undefined, NaN])('matches the admin inline format for %j', (n) => {
      expect(formatNumber(n)).toBe(Number(n || 0).toLocaleString('en-US'));
    });
    it('adds thousands separators', () => {
      expect(formatNumber(1234567)).toBe('1,234,567');
    });
  });

  describe('formatDate', () => {
    const dates = ['2026-08-05T09:30:00Z', '2026-01-01', new Date('2026-12-31T23:59:59Z'), 1767225600000];
    it.each(dates)('matches each replaced date format for %j', (d) => {
      // admin overview tooltip
      expect(formatDate(d, { dateStyle: 'medium', timeStyle: 'short' }))
        .toBe(new Date(d).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }));
      // billing subscriptions long date
      expect(formatDate(d, { year: 'numeric', month: 'long', day: 'numeric' }))
        .toBe(new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
      // extras ledger date + time
      const ledger = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
      expect(formatDate(d, ledger)).toBe(new Date(d).toLocaleString('en-US', ledger));
      // admin weekly bars (UTC week label)
      expect(formatDate(d, { month: 'short', day: 'numeric', timeZone: 'UTC' }))
        .toBe(new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }));
      // compute gauge reset label (en-US browser)
      expect(formatDate(d, { weekday: 'short', month: 'short', day: 'numeric' }))
        .toBe(new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
    });

    it('renders a known date', () => {
      expect(formatDate('2026-08-05T12:00:00Z', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })).toBe('August 5, 2026');
    });

    it('keeps "Invalid Date" for garbage, like toLocaleString', () => {
      expect(formatDate('garbage', { dateStyle: 'medium' })).toBe('Invalid Date');
    });
  });

  describe('timeAgo', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(NOW);
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    const ago = (ms) => new Date(NOW.getTime() - ms).toISOString();
    const MIN = 60000;
    const OFFSETS = [0, 30 * 1000, 5 * MIN, 59 * MIN, 3 * 60 * MIN, 25 * 60 * MIN, 2 * 1440 * MIN, 10 * 1440 * MIN, 45 * 1440 * MIN, -5 * MIN];

    /** The admin overview inline relative time, verbatim. */
    const oldShort = (iso) => {
      const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
      if (Number.isNaN(seconds)) return '';
      const rtf = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto', style: 'short' });
      const steps = [[60, 'second', 1], [3600, 'minute', 60], [86400, 'hour', 3600], [604800, 'day', 86400], [Infinity, 'week', 604800]];
      const [, unit, size] = steps.find(([limit]) => seconds < limit);
      return rtf.format(-Math.round(seconds / size), unit);
    };

    /** The organization general tab inline relative time, verbatim. */
    const oldCompact = (date) => {
      if (!date) return '';
      const diffMins = Math.floor((new Date() - new Date(date)) / 60000);
      if (diffMins < 1) return 'just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 30) return `${diffDays}d ago`;
      return `${Math.floor(diffDays / 30)}mo ago`;
    };

    it.each(OFFSETS)('short style matches the admin inline format %d ms ago', (ms) => {
      expect(timeAgo(ago(ms))).toBe(oldShort(ago(ms)));
    });

    it.each(OFFSETS)('compact style matches the organization tab inline format %d ms ago', (ms) => {
      expect(timeAgo(ago(ms), { style: 'compact' })).toBe(oldCompact(ago(ms)));
    });

    it('short style keeps the admin behaviour for null (epoch) and garbage', () => {
      expect(timeAgo(null)).toBe(oldShort(null));
      expect(timeAgo('garbage')).toBe('');
    });

    it('renders known values', () => {
      expect(timeAgo(ago(5 * MIN), { style: 'compact' })).toBe('5m ago');
      expect(timeAgo(ago(2 * 1440 * MIN), { style: 'compact' })).toBe('2d ago');
      expect(timeAgo(ago(30 * 1000), { style: 'compact' })).toBe('just now');
      expect(timeAgo(ago(-5 * MIN))).toBe(oldShort(ago(0)));
    });
  });
});
