import { describe, it, expect } from 'vitest';
import { sanitizeApiError } from '../apiError.js';

const FALLBACK = 'Failed to load data. Please try again.';

describe('apiError Helper', () => {
  describe('sanitizeApiError', () => {
    it('should pass through a clean, short server message', () => {
      const err = { response: { data: { message: 'User not found' } } };
      expect(sanitizeApiError(err)).toBe('User not found');
    });

    it('should redact a message containing a stack frame', () => {
      const err = {
        response: { data: { message: 'Error: at Object.<anonymous> (/app/path/to/file.js:42)' } },
      };
      expect(sanitizeApiError(err)).toBe(FALLBACK);
    });

    it('should redact a message mentioning an internal collection name', () => {
      const err = {
        response: { data: { message: 'E11000 duplicate key error collection: users index: email_1' } },
      };
      expect(sanitizeApiError(err)).toBe(FALLBACK);
    });

    it('should redact a message longer than 200 characters', () => {
      const err = { response: { data: { message: 'x'.repeat(201) } } };
      expect(sanitizeApiError(err)).toBe(FALLBACK);
    });

    it('should allow a message of exactly 200 characters', () => {
      const safeMsg = 'x'.repeat(200);
      const err = { response: { data: { message: safeMsg } } };
      expect(sanitizeApiError(err)).toBe(safeMsg);
    });

    it('should fall back to the generic message when no message is present', () => {
      expect(sanitizeApiError(new Error('Network error'))).toBe(FALLBACK);
      expect(sanitizeApiError({})).toBe(FALLBACK);
      expect(sanitizeApiError(undefined)).toBe(FALLBACK);
    });
  });
});
