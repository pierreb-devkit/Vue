import { describe, it, expect } from 'vitest';
import orgColor from '../orgColor';

const palette = [
  '#1abc9c', '#2ecc71', '#3498db', '#9b59b6', '#e67e22',
  '#e74c3c', '#1e90ff', '#ff6348', '#a55eea', '#0abde3',
  '#10ac84', '#ee5a24',
];

describe('orgColor Helper', () => {
  it('should return a color from the palette when given a string', () => {
    const color = orgColor('Acme Corp');
    expect(palette).toContain(color);
  });

  it('should return a color from the palette when given an object with name', () => {
    const color = orgColor({ name: 'Acme Corp' });
    expect(palette).toContain(color);
  });

  it('should return deterministic results for the same input', () => {
    const color1 = orgColor('Test Org');
    const color2 = orgColor('Test Org');
    expect(color1).toBe(color2);
  });

  it('should return different colors for different names', () => {
    const color1 = orgColor('Alpha');
    const color2 = orgColor('Zeta');
    expect(typeof color1).toBe('string');
    expect(typeof color2).toBe('string');
    expect(color1).not.toBe(color2);
  });

  it('should use slug when name is not available', () => {
    const color = orgColor({ slug: 'my-org' });
    expect(palette).toContain(color);
  });

  it('should use _id when name and slug are not available', () => {
    const color = orgColor({ _id: '507f1f77bcf86cd799439011' });
    expect(palette).toContain(color);
  });

  it('should use id when no other properties available', () => {
    const color = orgColor({ id: '12345' });
    expect(palette).toContain(color);
  });

  it('should handle an empty string', () => {
    const color = orgColor('');
    expect(palette).toContain(color);
  });

  it('should handle null/undefined org gracefully', () => {
    const nullColor = orgColor(null);
    const undefinedColor = orgColor(undefined);
    expect(palette).toContain(nullColor);
    expect(palette).toContain(undefinedColor);
  });

  it('should handle an empty object', () => {
    const color = orgColor({});
    expect(palette).toContain(color);
  });
});
