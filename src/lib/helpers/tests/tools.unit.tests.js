import { describe, it, expect } from 'vitest';
import { releasesNumber, pageRequest, serverItemsLength } from '../tools.js';

describe('Tools Helpers', () => {
  describe('releasesNumber', () => {
    it('should parse release version starting with v', () => {
      const result = releasesNumber('v2.3.4');
      expect(result).toEqual(['20', '3']);
    });

    it('should parse release version without v prefix', () => {
      const result = releasesNumber('2.3.4');
      expect(result).toEqual(['20', '3']);
    });

    it('should handle version 1.x.x specially', () => {
      const result = releasesNumber('1.5.2');
      expect(result).toEqual(['1', '5']);
    });

    it('should handle version v1.x.x specially', () => {
      const result = releasesNumber('v1.5.2');
      expect(result).toEqual(['1', '5']);
    });

    it('should multiply major version by 10 for versions >= 2', () => {
      const result = releasesNumber('3.2.1');
      expect(result).toEqual(['30', '2']);
    });

    it('should handle double digit major version', () => {
      const result = releasesNumber('10.5.3');
      expect(result).toEqual(['100', '5']);
    });

    it('should handle version with v prefix and double digit major', () => {
      const result = releasesNumber('v12.4.7');
      expect(result).toEqual(['120', '4']);
    });

    it('should pop the patch version', () => {
      const result = releasesNumber('5.9.99');
      expect(result).toHaveLength(2);
      expect(result).toEqual(['50', '9']);
    });

    it('should handle zero major version', () => {
      const result = releasesNumber('0.8.3');
      expect(result).toEqual(['0', '8']);
    });
  });

  describe('pageRequest', () => {
    it('should generate request string without search', () => {
      const result = pageRequest(1, 10, '');
      expect(result).toBe('0&10');
    });

    it('should calculate correct page offset', () => {
      const result = pageRequest(3, 20, '');
      expect(result).toBe('2&20');
    });

    it('should include search parameter when provided', () => {
      const result = pageRequest(1, 10, 'query');
      expect(result).toBe('0&10&query');
    });

    it('should include search parameter with multiple terms', () => {
      const result = pageRequest(2, 15, 'name=john&age=25');
      expect(result).toBe('1&15&name=john&age=25');
    });

    it('should not include search when empty string', () => {
      const result = pageRequest(5, 25, '');
      expect(result).toBe('4&25');
    });

    it('should not include search when null', () => {
      const result = pageRequest(5, 25, null);
      expect(result).toBe('4&25');
    });

    it('should not include search when undefined', () => {
      const result = pageRequest(5, 25, undefined);
      expect(result).toBe('4&25');
    });

    it('should handle page 1 correctly (zero offset)', () => {
      const result = pageRequest(1, 50, 'test');
      expect(result).toBe('0&50&test');
    });

    it('should handle large page numbers', () => {
      const result = pageRequest(100, 10, '');
      expect(result).toBe('99&10');
    });

    it('should handle large items per page', () => {
      const result = pageRequest(1, 1000, 'filter');
      expect(result).toBe('0&1000&filter');
    });
  });

  describe('serverItemsLength', () => {
    it('should return items per page + current when full page', () => {
      const items = new Array(10).fill({});
      const options = {
        page: 1,
        itemsPerPage: 10,
      };
      const result = serverItemsLength(items, options);
      expect(result).toBe(20);
    });

    it('should return exact count when partial last page', () => {
      const items = new Array(5).fill({});
      const options = {
        page: 2,
        itemsPerPage: 10,
      };
      const result = serverItemsLength(items, options);
      expect(result).toBe(20);
    });

    it('should handle first page with full items', () => {
      const items = new Array(25).fill({});
      const options = {
        page: 1,
        itemsPerPage: 25,
      };
      const result = serverItemsLength(items, options);
      expect(result).toBe(50);
    });

    it('should handle first page with partial items', () => {
      const items = new Array(10).fill({});
      const options = {
        page: 1,
        itemsPerPage: 25,
      };
      const result = serverItemsLength(items, options);
      expect(result).toBe(25);
    });

    it('should handle empty items array', () => {
      const items = [];
      const options = {
        page: 1,
        itemsPerPage: 10,
      };
      const result = serverItemsLength(items, options);
      expect(result).toBe(10);
    });

    it('should calculate total for page 3 with full items', () => {
      const items = new Array(15).fill({});
      const options = {
        page: 3,
        itemsPerPage: 15,
      };
      const result = serverItemsLength(items, options);
      expect(result).toBe(60);
    });

    it('should calculate total for page 3 with partial items', () => {
      const items = new Array(8).fill({});
      const options = {
        page: 3,
        itemsPerPage: 15,
      };
      const result = serverItemsLength(items, options);
      expect(result).toBe(45);
    });

    it('should handle large page numbers', () => {
      const items = new Array(50).fill({});
      const options = {
        page: 10,
        itemsPerPage: 50,
      };
      const result = serverItemsLength(items, options);
      expect(result).toBe(550);
    });

    it('should handle page 2 with less items than itemsPerPage', () => {
      const items = new Array(3).fill({});
      const options = {
        page: 2,
        itemsPerPage: 20,
      };
      const result = serverItemsLength(items, options);
      expect(result).toBe(40);
    });

    it('should work with different itemsPerPage values', () => {
      const items = new Array(100).fill({});
      const options = {
        page: 1,
        itemsPerPage: 100,
      };
      const result = serverItemsLength(items, options);
      expect(result).toBe(200);
    });
  });
});
