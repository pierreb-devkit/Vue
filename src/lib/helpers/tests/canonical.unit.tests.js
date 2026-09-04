import { describe, it, expect } from 'vitest';
import { buildCanonicalUrl } from '../canonical';

describe('buildCanonicalUrl Helper', () => {
  it('returns the bare base for the root path', () => {
    expect(buildCanonicalUrl('https://example.com', '/')).toBe('https://example.com');
  });

  it('appends a nested path to the base', () => {
    expect(buildCanonicalUrl('https://example.com', '/docs/x')).toBe('https://example.com/docs/x');
  });

  it('normalises a trailing-slash base and a trailing-slash path', () => {
    expect(buildCanonicalUrl('https://example.com/', '/docs/a/')).toBe('https://example.com/docs/a');
  });

  it('strips a query string from the path', () => {
    expect(buildCanonicalUrl('https://example.com', '/p?q=1')).toBe('https://example.com/p');
  });

  it('strips a hash fragment from the path', () => {
    expect(buildCanonicalUrl('https://example.com', '/p#section')).toBe('https://example.com/p');
  });

  it('returns an empty string when the base is empty', () => {
    expect(buildCanonicalUrl('', '/x')).toBe('');
  });

  it('returns an empty string when the base is undefined', () => {
    expect(buildCanonicalUrl(undefined, '/x')).toBe('');
  });

  it('defaults to the bare base when the path is undefined', () => {
    expect(buildCanonicalUrl('https://example.com')).toBe('https://example.com');
  });

  it('defaults to the bare base when the path is null', () => {
    expect(buildCanonicalUrl('https://example.com', null)).toBe('https://example.com');
  });

  it('returns the bare base when the path is an empty string', () => {
    expect(buildCanonicalUrl('https://example.com', '')).toBe('https://example.com');
  });
});
