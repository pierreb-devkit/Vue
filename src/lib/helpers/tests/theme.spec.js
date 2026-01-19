import { describe, it, expect, beforeEach, vi } from 'vitest';
import { isDark, style, liquidGlassStyle, overlapStyle, lightenColor } from '../theme.js';

describe('Theme Helpers', () => {
  describe('isDark', () => {
    beforeEach(() => {
      // Reset window.matchMedia
      delete window.matchMedia;
    });

    it('should return true when theme is explicitly true', () => {
      expect(isDark(true)).toBe(true);
    });

    it('should return false when theme is explicitly false', () => {
      expect(isDark(false)).toBe(false);
    });

    it('should return false when theme is undefined', () => {
      expect(isDark(undefined)).toBe(false);
    });

    it('should return false when theme is null', () => {
      expect(isDark(null)).toBe(false);
    });

    it('should detect auto dark mode from system preferences (dark)', () => {
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));

      expect(isDark('auto')).toBe(true);
    });

    it('should detect auto light mode from system preferences (light)', () => {
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));

      expect(isDark('auto')).toBe(false);
    });

    it('should return false when matchMedia is not available', () => {
      window.matchMedia = undefined;
      expect(isDark('auto')).toBe(false);
    });
  });

  describe('style', () => {
    it('should return empty object when no object provided', () => {
      expect(style('section', null)).toEqual({});
      expect(style('section', undefined)).toEqual({});
    });

    it('should return empty object when object has no style', () => {
      expect(style('section', {})).toEqual({});
    });

    it('should return empty object when style has no matching kind', () => {
      const object = {
        style: {
          card: { background: '#fff' },
        },
      };
      expect(style('section', object)).toEqual({});
    });

    it('should handle hex background color', () => {
      const object = {
        style: {
          section: { background: '#FF5733' },
        },
      };
      expect(style('section', object)).toEqual({
        background: '#FF5733',
      });
    });

    it('should handle linear-gradient background', () => {
      const object = {
        style: {
          section: { background: 'linear-gradient(to right, #fff, #000)' },
        },
      };
      expect(style('section', object)).toEqual({
        'background-image': 'linear-gradient(to right, #fff, #000)',
      });
    });

    it('should handle Vuetify theme color background', () => {
      const object = {
        style: {
          section: { background: 'primary' },
        },
      };
      expect(style('section', object)).toEqual({
        background: 'rgb(var(--v-theme-primary)) !important',
      });
    });

    it('should handle hex color', () => {
      const object = {
        style: {
          section: { color: '#123456' },
        },
      };
      expect(style('section', object)).toEqual({
        color: '#123456',
      });
    });

    it('should handle Vuetify theme color', () => {
      const object = {
        style: {
          section: { color: 'secondary' },
        },
      };
      expect(style('section', object)).toEqual({
        color: 'rgb(var(--v-theme-secondary)) !important',
      });
    });

    it('should handle height and width', () => {
      const object = {
        style: {
          section: {
            height: '100px',
            width: '200px',
          },
        },
      };
      expect(style('section', object)).toEqual({
        height: '100px !important',
        width: '200px !important',
      });
    });

    it('should handle border radius', () => {
      const object = {
        style: {
          section: { borderRadius: '10px' },
        },
      };
      expect(style('section', object)).toEqual({
        'border-radius': '10px !important',
      });
    });

    it('should handle multiple style properties', () => {
      const object = {
        style: {
          section: {
            background: '#FFFFFF',
            color: '#000000',
            height: '300px',
            width: '100%',
            borderRadius: '8px',
          },
        },
      };
      expect(style('section', object)).toEqual({
        background: '#FFFFFF',
        color: '#000000',
        height: '300px !important',
        width: '100% !important',
        'border-radius': '8px !important',
      });
    });
  });

  describe('liquidGlassStyle', () => {
    const mockTheme = {
      global: {
        name: {
          value: 'dark',
        },
      },
      current: {
        colors: {
          background: '#121212',
          surface: '#FFFFFF',
        },
      },
    };

    it('should generate default liquid glass style for dark theme', () => {
      const result = liquidGlassStyle({ vuetifyTheme: mockTheme });

      expect(result).toHaveProperty('background');
      expect(result).toHaveProperty('border');
      expect(result).toHaveProperty('borderRadius', '16px');
      expect(result).toHaveProperty('boxShadow');
      expect(result).toHaveProperty('-webkit-backdrop-filter');
      expect(result).toHaveProperty('backdrop-filter');
    });

    it('should generate liquid glass style for light theme', () => {
      const lightTheme = {
        global: { name: { value: 'light' } },
        current: { colors: { background: '#FFFFFF', surface: '#F5F5F5' } },
      };

      const result = liquidGlassStyle({ vuetifyTheme: lightTheme });

      expect(result).toHaveProperty('background');
      expect(result).toHaveProperty('borderRadius', '16px');
    });

    it('should handle intensity parameter', () => {
      const result1 = liquidGlassStyle({ vuetifyTheme: mockTheme, intensity: 0 });
      const result2 = liquidGlassStyle({ vuetifyTheme: mockTheme, intensity: 1 });

      expect(result1['-webkit-backdrop-filter']).toContain('blur(6px)');
      expect(result2['-webkit-backdrop-filter']).toContain('blur(18px)');
    });

    it('should handle tint parameter with auto', () => {
      const result = liquidGlassStyle({ vuetifyTheme: mockTheme, tint: 'auto' });
      expect(result).toHaveProperty('background');
    });

    it('should handle tint parameter with number', () => {
      const result = liquidGlassStyle({ vuetifyTheme: mockTheme, tint: 0.5 });
      expect(result).toHaveProperty('background');
    });

    it('should handle pill variant', () => {
      const result = liquidGlassStyle({ vuetifyTheme: mockTheme, variant: 'pill' });
      expect(result.borderRadius).toBe('9999px');
    });

    it('should handle header variant', () => {
      const result = liquidGlassStyle({ vuetifyTheme: mockTheme, variant: 'header' });
      expect(result.borderRadius).toBe('0');
    });

    it('should handle card variant', () => {
      const result = liquidGlassStyle({ vuetifyTheme: mockTheme, variant: 'card' });
      expect(result.borderRadius).toBe('16px');
    });

    it('should handle border none', () => {
      const result = liquidGlassStyle({ vuetifyTheme: mockTheme, border: 'none' });
      expect(result.border).toBe('none');
      expect(result.borderTop).toBeUndefined();
      expect(result.borderBottom).toBeUndefined();
    });

    it('should handle border bottom', () => {
      const result = liquidGlassStyle({ vuetifyTheme: mockTheme, border: 'bottom' });
      expect(result).toHaveProperty('borderBottom');
      expect(result.borderTop).toBeUndefined();
    });

    it('should handle border top', () => {
      const result = liquidGlassStyle({ vuetifyTheme: mockTheme, border: 'top' });
      expect(result).toHaveProperty('borderTop');
      expect(result.borderBottom).toBeUndefined();
    });

    it('should handle border all', () => {
      const result = liquidGlassStyle({ vuetifyTheme: mockTheme, border: 'all' });
      expect(result.border).not.toBe('none');
    });

    it('should handle glowBorder true', () => {
      const result = liquidGlassStyle({ vuetifyTheme: mockTheme, glowBorder: true });
      expect(result).toHaveProperty('--glow-border', '1');
      expect(result).toHaveProperty('--glow-rotation', '135deg');
    });

    it('should handle glowBorder animated', () => {
      const result = liquidGlassStyle({ vuetifyTheme: mockTheme, glowBorder: 'animated' });
      expect(result).toHaveProperty('--glow-border', '1');
      expect(result).toHaveProperty('--glow-rotation', 'var(--gradient-rotation, 135deg)');
    });

    it('should handle glowBorder false', () => {
      const result = liquidGlassStyle({ vuetifyTheme: mockTheme, glowBorder: false });
      expect(result).not.toHaveProperty('--glow-border');
    });

    it('should merge extras into result', () => {
      const extras = { color: '#FF0000', padding: '20px' };
      const result = liquidGlassStyle({ vuetifyTheme: mockTheme, extras });

      expect(result.color).toBe('#FF0000');
      expect(result.padding).toBe('20px');
    });

    it('should handle missing theme properties gracefully', () => {
      const minimalTheme = {};
      const result = liquidGlassStyle({ vuetifyTheme: minimalTheme });

      expect(result).toHaveProperty('background');
      expect(result).toHaveProperty('borderRadius');
    });

    it('should clamp intensity between 0 and 1', () => {
      const result1 = liquidGlassStyle({ vuetifyTheme: mockTheme, intensity: -0.5 });
      const result2 = liquidGlassStyle({ vuetifyTheme: mockTheme, intensity: 1.5 });

      expect(result1['-webkit-backdrop-filter']).toContain('blur(6px)');
      expect(result2['-webkit-backdrop-filter']).toContain('blur(18px)');
    });

    it('should clamp tint between -1 and 1', () => {
      const result1 = liquidGlassStyle({ vuetifyTheme: mockTheme, tint: -2 });
      const result2 = liquidGlassStyle({ vuetifyTheme: mockTheme, tint: 2 });

      expect(result1).toHaveProperty('background');
      expect(result2).toHaveProperty('background');
    });
  });

  describe('overlapStyle', () => {
    const mockDisplay = {
      smAndDown: false,
    };

    it('should return empty object when overlap is false', () => {
      expect(overlapStyle(false, mockDisplay)).toEqual({});
    });

    it('should return empty object when overlap is null', () => {
      expect(overlapStyle(null, mockDisplay)).toEqual({});
    });

    it('should return empty object when overlap is undefined', () => {
      expect(overlapStyle(undefined, mockDisplay)).toEqual({});
    });

    it('should return default overlap for desktop when overlap is true', () => {
      const result = overlapStyle(true, mockDisplay);
      expect(result).toEqual({
        'margin-top': '-40vh',
        position: 'relative',
        'z-index': '10',
      });
    });

    it('should return default overlap for mobile when overlap is true', () => {
      const mobileDisplay = { smAndDown: true };
      const result = overlapStyle(true, mobileDisplay);
      expect(result).toEqual({
        'margin-top': '-20vh',
        position: 'relative',
        'z-index': '10',
      });
    });

    it('should handle string overlap value', () => {
      const result = overlapStyle('30vh', mockDisplay);
      expect(result).toEqual({
        'margin-top': '-30vh',
        position: 'relative',
        'z-index': '10',
      });
    });

    it('should handle object overlap for desktop', () => {
      const overlap = { mobile: '15vh', desktop: '50vh' };
      const result = overlapStyle(overlap, mockDisplay);
      expect(result).toEqual({
        'margin-top': '-50vh',
        position: 'relative',
        'z-index': '10',
      });
    });

    it('should handle object overlap for mobile', () => {
      const overlap = { mobile: '15vh', desktop: '50vh' };
      const mobileDisplay = { smAndDown: true };
      const result = overlapStyle(overlap, mobileDisplay);
      expect(result).toEqual({
        'margin-top': '-15vh',
        position: 'relative',
        'z-index': '10',
      });
    });

    it('should use defaults when object overlap is missing values for desktop', () => {
      const overlap = {};
      const result = overlapStyle(overlap, mockDisplay);
      expect(result).toEqual({
        'margin-top': '-40vh',
        position: 'relative',
        'z-index': '10',
      });
    });

    it('should use defaults when object overlap is missing values for mobile', () => {
      const overlap = {};
      const mobileDisplay = { smAndDown: true };
      const result = overlapStyle(overlap, mobileDisplay);
      expect(result).toEqual({
        'margin-top': '-20vh',
        position: 'relative',
        'z-index': '10',
      });
    });

    it('should return empty object for invalid overlap type', () => {
      expect(overlapStyle(123, mockDisplay)).toEqual({});
    });

    it('should handle display without smAndDown property', () => {
      const result = overlapStyle(true, {});
      expect(result['margin-top']).toBe('-40vh');
    });
  });

  describe('lightenColor', () => {
    it('should lighten a hex color', () => {
      const result = lightenColor('#808080', 50);
      expect(result).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(result).not.toBe('#808080');
    });

    it('should return lighter color for positive percent', () => {
      const original = '#000000';
      const lightened = lightenColor(original, 30);
      expect(lightened).not.toBe('#000000');
    });

    it('should return darker color for negative percent', () => {
      const original = '#FFFFFF';
      const darkened = lightenColor(original, -30);
      expect(darkened).not.toBe('#FFFFFF');
    });

    it('should return original-ish color for zero percent', () => {
      const original = '#FF5733';
      const result = lightenColor(original, 0);
      expect(result).toBe('#ff5733');
    });

    it('should handle invalid hex color', () => {
      const result = lightenColor('invalid', 50);
      expect(result).toBe('#808080');
    });

    it('should handle color without # prefix', () => {
      const result = lightenColor('FF5733', 20);
      expect(result).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it('should handle extreme lighten values', () => {
      const result = lightenColor('#000000', 100);
      expect(result).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it('should handle extreme darken values', () => {
      const result = lightenColor('#FFFFFF', -100);
      expect(result).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });
});
