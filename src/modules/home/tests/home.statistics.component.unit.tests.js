import { mount } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import HomeStatisticsComponent, { parseStatValue, easeOutCubic } from '../components/home.statistics.component.vue';

vi.mock('../components/utils/home.blur.background.component.vue', () => ({
  default: {
    name: 'HomeBlurBackgroundComponent',
    template: '<div><slot /></div>',
    props: ['ratio', 'animationSpeed', 'backgroundColors', 'haloColors', 'haloCount', 'noMargin'],
  },
}));

vi.mock('../../../lib/helpers/theme', () => ({
  overlapStyle: () => ({}),
  colorModeStyle: () => ({}),
}));

const mockConfig = {
  vuetify: { theme: { maxWidth: '1200px' } },
};

const globalOpts = (vuetify) => ({
  plugins: [vuetify],
  config: {
    globalProperties: { config: mockConfig },
  },
});

describe('parseStatValue', () => {
  it('parses integer with suffix', () => {
    const result = parseStatValue('1000+');
    expect(result).toEqual({ num: 1000, prefix: '', suffix: '+', decimals: 0 });
  });

  it('parses decimal with prefix', () => {
    const result = parseStatValue('x2.08');
    expect(result).toEqual({ num: 2.08, prefix: 'x', suffix: '', decimals: 2 });
  });

  it('parses integer with letter suffix', () => {
    const result = parseStatValue('50m');
    expect(result).toEqual({ num: 50, prefix: '', suffix: 'm', decimals: 0 });
  });

  it('parses plain number', () => {
    const result = parseStatValue('42');
    expect(result).toEqual({ num: 42, prefix: '', suffix: '', decimals: 0 });
  });

  it('returns null for non-numeric string', () => {
    expect(parseStatValue('abc')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parseStatValue('')).toBeNull();
  });

  it('handles numeric input coerced to string', () => {
    const result = parseStatValue(100);
    expect(result).toEqual({ num: 100, prefix: '', suffix: '', decimals: 0 });
  });
});

describe('easeOutCubic', () => {
  it('returns 0 at t=0', () => {
    expect(easeOutCubic(0)).toBe(0);
  });

  it('returns 1 at t=1', () => {
    expect(easeOutCubic(1)).toBe(1);
  });

  it('returns value between 0 and 1 for mid-progress', () => {
    const result = easeOutCubic(0.5);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(1);
    expect(result).toBeCloseTo(0.875, 3);
  });

  it('produces decelerating curve (higher progress at mid-point than linear)', () => {
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5);
  });
});

describe('HomeStatisticsComponent', () => {
  let vuetify;

  beforeEach(() => {
    setActivePinia(createPinia());
    vuetify = createVuetify({ components, directives });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders stat titles', () => {
    const wrapper = mount(HomeStatisticsComponent, {
      props: {
        setup: [
          { value: '1000+', title: 'Users' },
          { value: '50', title: 'Releases' },
        ],
      },
      global: globalOpts(vuetify),
    });
    expect(wrapper.text()).toContain('Users');
    expect(wrapper.text()).toContain('Releases');
  });

  it('shows final values when animated is false', () => {
    const wrapper = mount(HomeStatisticsComponent, {
      props: {
        setup: [
          { value: '1000+', title: 'Users' },
          { value: '50', title: 'Releases' },
        ],
        animated: false,
      },
      global: globalOpts(vuetify),
    });
    expect(wrapper.text()).toContain('1000+');
    expect(wrapper.text()).toContain('50');
  });

  it('shows final values when prefers-reduced-motion is set', () => {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    const wrapper = mount(HomeStatisticsComponent, {
      props: {
        setup: [
          { value: '1000+', title: 'Users' },
          { value: 'x2.08', title: 'Multiplier' },
        ],
      },
      global: globalOpts(vuetify),
    });
    expect(wrapper.text()).toContain('1000+');
    expect(wrapper.text()).toContain('x2.08');

    window.matchMedia = originalMatchMedia;
  });

  it('cleans up observer on unmount', () => {
    const disconnectSpy = vi.fn();
    const observeSpy = vi.fn();
    class MockIntersectionObserver {
      constructor() {
        this.observe = observeSpy;
        this.disconnect = disconnectSpy;
        this.unobserve = vi.fn();
      }
    }
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

    const wrapper = mount(HomeStatisticsComponent, {
      props: {
        setup: [{ value: '100', title: 'Test' }],
      },
      global: globalOpts(vuetify),
    });

    wrapper.unmount();
    expect(disconnectSpy).toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it('falls back to immediate animation when IntersectionObserver is unavailable', () => {
    const originalIO = globalThis.IntersectionObserver;
    delete globalThis.IntersectionObserver;

    const wrapper = mount(HomeStatisticsComponent, {
      props: {
        setup: [{ value: '100', title: 'Test' }],
      },
      global: globalOpts(vuetify),
    });

    // Component should not throw and hasAnimated should be true after observeSection fallback
    expect(wrapper.vm.hasAnimated).toBe(true);

    globalThis.IntersectionObserver = originalIO;
  });

  it('identifies pending stat values', () => {
    const wrapper = mount(HomeStatisticsComponent, {
      props: {
        setup: [{ value: '100', title: 'Test' }],
        animated: false,
      },
      global: globalOpts(vuetify),
    });

    expect(wrapper.vm.isPendingStatValue('0')).toBe(true);
    expect(wrapper.vm.isPendingStatValue(' 0 ')).toBe(true);
    expect(wrapper.vm.isPendingStatValue('100')).toBe(false);
    expect(wrapper.vm.isPendingStatValue('1000+')).toBe(false);
    expect(wrapper.vm.isPendingStatValue(0)).toBe(false);
  });

  describe('haloCount prop (T5)', () => {
    it('defaults haloCount to 4', () => {
      const wrapper = mount(HomeStatisticsComponent, {
        props: { setup: [{ value: '100', title: 'Test' }] },
        global: globalOpts(vuetify),
      });
      expect(wrapper.vm.haloCount).toBe(4);
    });

    it('passes haloCount to homeBlurBackgroundComponent', () => {
      const wrapper = mount(HomeStatisticsComponent, {
        props: { setup: [{ value: '100', title: 'Test' }], haloCount: 2 },
        global: globalOpts(vuetify),
      });
      const blur = wrapper.findComponent({ name: 'HomeBlurBackgroundComponent' });
      expect(blur.props('haloCount')).toBe(2);
    });

    it('accepts valid haloCount values 1 through 5', () => {
      [1, 2, 3, 4, 5].forEach((count) => {
        const wrapper = mount(HomeStatisticsComponent, {
          props: { setup: [{ value: '10', title: 'T' }], haloCount: count },
          global: globalOpts(vuetify),
        });
        expect(wrapper.vm.haloCount).toBe(count);
      });
    });
  });
});
