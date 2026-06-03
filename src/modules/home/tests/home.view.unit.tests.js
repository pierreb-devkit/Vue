import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createVuetify } from 'vuetify';

/**
 * Hoisted store action mocks — must be defined before any imports that use them.
 */
const initStatisticsMock = vi.hoisted(() => vi.fn());
const getStatisticsMock = vi.hoisted(() => vi.fn());
const getNewsMock = vi.hoisted(() => vi.fn());

vi.mock('../stores/home.store', () => ({
  useHomeStore: () => ({
    news: [],
    statistics: null,
    initStatistics: initStatisticsMock,
    getStatistics: getStatisticsMock,
    getNews: getNewsMock,
  }),
}));

// Stub all child components to avoid deep render
vi.mock('../components/home.hero.component.vue', () => ({ default: { template: '<div />' } }));
vi.mock('../components/home.presentation.component.vue', () => ({ default: { template: '<div />' } }));
vi.mock('../components/home.about.component.vue', () => ({ default: { template: '<div />' } }));
vi.mock('../components/home.capabilities.component.vue', () => ({ default: { template: '<div />' } }));
vi.mock('../components/home.features.component.vue', () => ({ default: { template: '<div />' } }));
vi.mock('../components/home.services.component.vue', () => ({ default: { template: '<div />' } }));
vi.mock('../components/home.steps.component.vue', () => ({ default: { template: '<div />' } }));
vi.mock('../components/home.gallery.component.vue', () => ({ default: { template: '<div />' } }));
vi.mock('../components/home.social.component.vue', () => ({ default: { template: '<div />' } }));
vi.mock('../components/home.articles.component.vue', () => ({ default: { template: '<div />' } }));
vi.mock('../components/home.statistics.component.vue', () => ({ default: { template: '<div />' } }));
vi.mock('../components/home.faq.component.vue', () => ({ default: { template: '<div />' } }));
vi.mock('../components/home.cta.component.vue', () => ({ default: { template: '<div />' } }));
vi.mock('../components/home.contact.component.vue', () => ({ default: { template: '<div />' } }));

import HomeView from '../views/home.view.vue';

/**
 * Mount home.view with a given config.
 * @param {Object} homeConfig - Value of config.home
 * @returns {import('@vue/test-utils').VueWrapper}
 */
const mountView = (homeConfig = {}) =>
  mount(HomeView, {
    global: {
      plugins: [createVuetify(), createPinia()],
      config: {
        globalProperties: {
          config: { home: homeConfig },
        },
      },
    },
  });

describe('home.view — created() statistics.dynamic guard (T4)', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('calls initStatistics and getStatistics when statistics is truthy and dynamic is not set', async () => {
    mountView({ statistics: { content: [] } });
    await flushPromises();

    expect(initStatisticsMock).toHaveBeenCalledTimes(1);
    expect(getStatisticsMock).toHaveBeenCalledTimes(1);
  });

  it('calls initStatistics but skips getStatistics when statistics.dynamic is false', async () => {
    mountView({ statistics: { content: [], dynamic: false } });
    await flushPromises();

    expect(initStatisticsMock).toHaveBeenCalledTimes(1);
    expect(getStatisticsMock).not.toHaveBeenCalled();
  });

  it('calls initStatistics and getStatistics when statistics.dynamic is true', async () => {
    mountView({ statistics: { content: [], dynamic: true } });
    await flushPromises();

    expect(initStatisticsMock).toHaveBeenCalledTimes(1);
    expect(getStatisticsMock).toHaveBeenCalledTimes(1);
  });

  it('skips initStatistics and getStatistics when config.home.statistics is falsy', async () => {
    mountView({});
    await flushPromises();

    expect(initStatisticsMock).not.toHaveBeenCalled();
    expect(getStatisticsMock).not.toHaveBeenCalled();
  });

  it('calls getNews when config.home.articles is set', async () => {
    mountView({ articles: { enabled: true } });
    await flushPromises();

    expect(getNewsMock).toHaveBeenCalledTimes(1);
  });

  it('does not call getNews when config.home.articles is falsy', async () => {
    mountView({});
    await flushPromises();

    expect(getNewsMock).not.toHaveBeenCalled();
  });
});
