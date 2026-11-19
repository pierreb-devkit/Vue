import { describe, it, expect } from 'vitest';
import orgColor, { hashColor, avatarTextClass, palette as sharedPalette, userPalette as sharedUserPalette } from '../orgColor';

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

describe('hashColor Helper', () => {
  /** The user avatar inline hash, verbatim. */
  const oldStringToColor = (str, pal) => {
    let hash = 0;
    for (let i = 0; i < str.length; i += 1) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return pal[Math.abs(hash) % pal.length];
  };
  const userPalette = ['#1E88E5', '#43A047', '#E53935', '#8E24AA', '#FB8C00', '#00ACC1', '#3949AB', '#D81B60', '#7CB342', '#6D4C41', '#5E35B1', '#039BE5', '#C0CA33', '#F4511E', '#00897B', '#FFB300'];

  it.each(['', 'a', 'john@doe.com', 'very.long.address+tag@example.org'])('matches the user avatar inline hash for %j', (s) => {
    expect(hashColor(s, userPalette)).toBe(oldStringToColor(s, userPalette));
  });

  it('backs orgColor with the organization palette', () => {
    expect(orgColor('Acme Corp')).toBe(hashColor('Acme Corp', palette));
  });
});

describe('avatar palettes', () => {
  it('keeps the user palette of origin/master', () => {
    expect(sharedUserPalette).toEqual(['#1E88E5', '#43A047', '#E53935', '#8E24AA', '#FB8C00', '#00ACC1', '#3949AB', '#D81B60', '#7CB342', '#6D4C41', '#5E35B1', '#039BE5', '#C0CA33', '#F4511E', '#00897B', '#FFB300']);
  });

  it('is the organization palette hashColor uses by default', () => {
    expect(sharedPalette).toEqual(palette);
    expect(hashColor('john@doe.com')).toBe(hashColor('john@doe.com', palette));
  });
});

describe('avatarTextClass Helper', () => {
  it('puts dark text on light colours', () => {
    expect(avatarTextClass('#ffffff')).toBe('text-black');
    expect(avatarTextClass('#2ecc71')).toBe('text-black');
  });

  it('puts white text on dark colours', () => {
    expect(avatarTextClass('#000000')).toBe('text-white');
    expect(avatarTextClass('#9b59b6')).toBe('text-white');
  });
});
