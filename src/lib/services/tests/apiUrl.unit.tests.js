import { describe, it, expect } from 'vitest';
import { formatApiUrl } from '../apiUrl.js';

describe('formatApiUrl', () => {
  it('builds the protocol://host:port/base prefix from its parts', () => {
    expect(formatApiUrl({ protocol: 'http', host: 'localhost', port: 3000, base: 'api' })).toBe(
      'http://localhost:3000/api',
    );
  });

  it('accepts a string port unchanged', () => {
    expect(formatApiUrl({ protocol: 'https', host: 'example.com', port: '443', base: 'api' })).toBe(
      'https://example.com:443/api',
    );
  });
});
