import { describe, it, expect } from 'vitest';
import model from '../model';

describe('model middleware', () => {
  describe('clean(data, model)', () => {
    it('picks only whitelisted fields', () => {
      const data = { firstName: 'John', lastName: 'Doe', _id: 'secret', password: 'hidden' };
      const whitelist = ['firstName', 'lastName'];
      const result = model.clean(data, whitelist);
      expect(result).toEqual({ firstName: 'John', lastName: 'Doe' });
    });

    it('omits null values from the result', () => {
      const data = { firstName: 'John', lastName: null, bio: null, email: 'j@example.com' };
      const whitelist = ['firstName', 'lastName', 'bio', 'email'];
      const result = model.clean(data, whitelist);
      expect(result).toEqual({ firstName: 'John', email: 'j@example.com' });
      expect(result).not.toHaveProperty('lastName');
      expect(result).not.toHaveProperty('bio');
    });

    it('keeps non-null falsy values like empty string and 0', () => {
      const data = { firstName: '', count: 0, active: false };
      const whitelist = ['firstName', 'count', 'active'];
      const result = model.clean(data, whitelist);
      expect(result).toEqual({ firstName: '', count: 0, active: false });
    });

    it('returns empty object when data is empty', () => {
      const result = model.clean({}, ['firstName', 'lastName']);
      expect(result).toEqual({});
    });

    it('returns empty object when whitelist has no matching fields', () => {
      const data = { firstName: 'John', lastName: 'Doe' };
      const result = model.clean(data, ['email', 'bio']);
      expect(result).toEqual({});
    });

    it('returns empty object when whitelist is empty', () => {
      const data = { firstName: 'John', lastName: 'Doe' };
      const result = model.clean(data, []);
      expect(result).toEqual({});
    });

    it('does not include unknown fields not in whitelist', () => {
      const data = { firstName: 'John', _id: '123', __v: 0, createdAt: new Date() };
      const whitelist = ['firstName'];
      const result = model.clean(data, whitelist);
      expect(Object.keys(result)).toEqual(['firstName']);
    });

    it('handles all null values by returning empty object', () => {
      const data = { firstName: null, lastName: null };
      const whitelist = ['firstName', 'lastName'];
      const result = model.clean(data, whitelist);
      expect(result).toEqual({});
    });
  });
});
