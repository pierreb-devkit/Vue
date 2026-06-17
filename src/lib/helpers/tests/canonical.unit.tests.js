import { describe, it, expect } from 'vitest';
import { buildCanonicalUrl } from '../canonical';

describe('buildCanonicalUrl Helper', () => {
  it('returns the bare base for the root path', () => {
    expect(buildCanonicalUrl('https://x.com', '/')).toBe('https://x.com');
  });

  it('appends a nested path to the base', () => {
    expect(buildCanonicalUrl('https://x.com', '/docs/x')).toBe('https://x.com/docs/x');
  });

  it('normalises a trailing-slash base and a trailing-slash path', () => {
    expect(buildCanonicalUrl('https://x.com/', '/docs/a/')).toBe('https://x.com/docs/a');
  });

  it('strips a query string from the path', () => {
    expect(buildCanonicalUrl('https://x.com', '/p?q=1')).toBe('https://x.com/p');
  });

  it('strips a hash fragment from the path', () => {
    expect(buildCanonicalUrl('https://x.com', '/p#section')).toBe('https://x.com/p');
  });

  it('returns an empty string when the base is empty', () => {
    expect(buildCanonicalUrl('', '/x')).toBe('');
  });

  it('returns an empty string when the base is undefined', () => {
    expect(buildCanonicalUrl(undefined, '/x')).toBe('');
  });

  it('defaults to the bare base when the path is undefined', () => {
    expect(buildCanonicalUrl('https://x.com')).toBe('https://x.com');
  });

  it('defaults to the bare base when the path is null', () => {
    expect(buildCanonicalUrl('https://x.com', null)).toBe('https://x.com');
  });

  it('returns the bare base when the path is an empty string', () => {
    expect(buildCanonicalUrl('https://x.com', '')).toBe('https://x.com');
  });
});
