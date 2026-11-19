import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useHomeStore } from '../stores/home.store';
import axios from '../../../lib/services/axios';

// Mock axios
vi.mock('../../../lib/services/axios', () => ({
  default: {
    get: vi.fn(),
  },
}));

// Module activation — flipped per test (default: everything on)
const inactiveModules = vi.hoisted(() => new Set());
vi.mock('../../../lib/helpers/modules', () => ({
  isModuleActive: (name) => !inactiveModules.has(name),
}));

// Mock GhostContentAPI
vi.mock('@tryghost/content-api', () => {
  return {
    default: vi.fn(() => ({
      posts: {
        browse: vi.fn(),
      },
    })),
  };
});

describe('Home Store', () => {
  beforeEach(() => {
    // Create a new pinia instance for each test
    setActivePinia(createPinia());
  });

  it('should initialize with default state', () => {
    const homeStore = useHomeStore();
    expect(homeStore.team).toEqual([]);
    expect(homeStore.contents).toEqual([]);
    expect(homeStore.news).toEqual([]);
    expect(homeStore.contact).toEqual({});
    expect(homeStore.statistics).toBe(null);
  });

  it('should initialize statistics from config', () => {
    const homeStore = useHomeStore();
    homeStore.initStatistics();

    // Statistics should be initialized from config
    expect(homeStore.statistics).toBeDefined();
  });

  it('should update contact data', () => {
    const homeStore = useHomeStore();

    homeStore.updateContact({
      name: 'John Doe',
      email: 'john@example.com',
    });

    homeStore.updateContact({
      message: 'Updated message',
    });

    expect(homeStore.contact).toEqual({
      name: 'John Doe',
      email: 'john@example.com',
      message: 'Updated message',
    });
  });

  it('should maintain team array', () => {
    const homeStore = useHomeStore();
    const mockTeam = [
      { name: 'Member 1', role: 'Developer' },
      { name: 'Member 2', role: 'Designer' },
    ];

    homeStore.team = mockTeam;

    expect(homeStore.team).toEqual(mockTeam);
    expect(homeStore.team.length).toBe(2);
  });

  it('should maintain contents array', () => {
    const homeStore = useHomeStore();
    const mockContents = [
      { title: 'Content 1', body: 'Body 1' },
      { title: 'Content 2', body: 'Body 2' },
    ];

    homeStore.contents = mockContents;

    expect(homeStore.contents).toEqual(mockContents);
    expect(homeStore.contents.length).toBe(2);
  });

  it('should maintain news array', () => {
    const homeStore = useHomeStore();
    const mockNews = [
      { title: 'News 1', content: 'Content 1' },
      { title: 'News 2', content: 'Content 2' },
    ];

    homeStore.news = mockNews;

    expect(homeStore.news).toEqual(mockNews);
    expect(homeStore.news.length).toBe(2);
  });

  describe('getTeam', () => {
    it('should fetch and set team data', async () => {
      const homeStore = useHomeStore();
      const mockTeamData = {
        data: {
          data: [
            { name: 'John Doe', role: 'Developer' },
            { name: 'Jane Smith', role: 'Designer' },
          ],
        },
      };

      axios.get.mockResolvedValueOnce(mockTeamData);

      await homeStore.getTeam();

      expect(homeStore.team).toEqual(mockTeamData.data.data);
    });

    it('should handle getTeam error', async () => {
      const homeStore = useHomeStore();
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      axios.get.mockRejectedValueOnce(new Error('Failed to fetch team'));

      await homeStore.getTeam();

      expect(homeStore.team).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('getPages', () => {
    it('should fetch and transform page data with banner', async () => {
      const homeStore = useHomeStore();
      const mockPagesData = {
        data: {
          data: [
            {
              title: 'About Us',
              markdown: '![Banner](/images/banner.jpg)\n\nContent here',
            },
          ],
        },
      };

      axios.get.mockResolvedValueOnce(mockPagesData);

      await homeStore.getPages('about');

      expect(homeStore.contents).toHaveLength(1);
      expect(homeStore.contents[0].title).toBe('About Us');
      expect(homeStore.contents[0].banner).toBe('/images/banner.jpg');
      expect(homeStore.contents[0].style).toBe('classic');
      expect(homeStore.contents[0].markdown).toBe('Content here');
    });

    it('should fetch and transform page data without banner', async () => {
      const homeStore = useHomeStore();
      const mockPagesData = {
        data: {
          data: [
            {
              title: 'Terms',
              markdown: 'Terms and conditions content',
            },
          ],
        },
      };

      axios.get.mockResolvedValueOnce(mockPagesData);

      await homeStore.getPages('terms');

      expect(homeStore.contents).toHaveLength(1);
      expect(homeStore.contents[0].title).toBe('Terms');
      expect(homeStore.contents[0].banner).toBe(null);
      expect(homeStore.contents[0].markdown).toBe('Terms and conditions content');
    });

    it('should handle getPages error', async () => {
      const homeStore = useHomeStore();
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      axios.get.mockRejectedValueOnce(new Error('Failed to fetch pages'));

      await homeStore.getPages('test');

      expect(homeStore.contents).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('getNews', () => {
    it('should handle missing blog configuration', async () => {
      const homeStore = useHomeStore();
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await homeStore.getNews();

      // Should not crash and news should remain empty
      expect(homeStore.news).toEqual([]);
      consoleWarnSpy.mockRestore();
    });

    it('loads the latest articles, and logs a failed load', async () => {
      const config = (await import('../../../lib/services/config')).default;
      const GhostContentAPI = (await import('@tryghost/content-api')).default;
      const saved = config.home.articles;
      config.home.articles = { url: 'https://blog.example.com', key: 'k' };
      const browse = vi.fn().mockResolvedValueOnce([{ title: 'Post' }]).mockRejectedValueOnce(new Error('down'));
      GhostContentAPI.mockImplementation(function Ghost() { return { posts: { browse } }; });
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        const homeStore = useHomeStore();
        await homeStore.getNews();
        expect(browse).toHaveBeenCalledWith({ limit: 6, filter: 'tag:article' });
        expect(homeStore.news).toEqual([{ title: 'Post' }]);

        await homeStore.getNews();
        expect(errSpy).toHaveBeenCalled();
        expect(homeStore.news).toEqual([{ title: 'Post' }]);
      } finally {
        config.home.articles = saved;
        errSpy.mockRestore();
      }
    });
  });

  describe('initStatistics', () => {
    beforeEach(() => inactiveModules.clear());

    it('copies the configured items (the config itself is never mutated)', async () => {
      const config = (await import('../../../lib/services/config')).default;
      const homeStore = useHomeStore();
      homeStore.initStatistics();
      expect(homeStore.statistics.map((i) => i.title)).toEqual(config.home.statistics.content.map((i) => i.title));
      homeStore.statistics[0].value = 'changed';
      expect(config.home.statistics.content[0].value).not.toBe('changed');
    });

    it('drops an item whose module is switched off', () => {
      inactiveModules.add('tasks');
      const homeStore = useHomeStore();
      homeStore.initStatistics();
      expect(homeStore.statistics.map((i) => i.title)).not.toContain('Tasks');
      expect(homeStore.statistics.map((i) => i.title)).toContain('Users');
    });

    it('sets statistics to null when the config has no content list', async () => {
      const config = (await import('../../../lib/services/config')).default;
      const saved = config.home.statistics.content;
      config.home.statistics.content = undefined;
      try {
        const homeStore = useHomeStore();
        homeStore.initStatistics();
        expect(homeStore.statistics).toBeNull();
      } finally {
        config.home.statistics.content = saved;
      }
    });
  });

  describe('getStatistics', () => {
    beforeEach(() => axios.get.mockReset());

    it('fetches each item that names a source and fills its value', async () => {
      const homeStore = useHomeStore();
      homeStore.statistics = [
        { title: 'Tasks', value: '0', source: 'tasks' },
        { title: 'Users', value: '0', source: 'account' },
        { title: 'Downloads', value: '50m' },
      ];
      axios.get.mockImplementation(async (url) => ({ data: { data: String(url).includes('/tasks/') ? 150 : 1000 } }));

      await homeStore.getStatistics();

      expect(axios.get).toHaveBeenCalledTimes(2);
      expect(axios.get.mock.calls.map(([url]) => url).some((u) => u.endsWith('/tasks/stats'))).toBe(true);
      expect(axios.get.mock.calls.map(([url]) => url).some((u) => u.endsWith('/account/stats'))).toBe(true);
      expect(homeStore.statistics.map((i) => i.value)).toEqual([150, 1000, '50m']);
    });

    it('logs a failed fetch and still fills the other items', async () => {
      const homeStore = useHomeStore();
      homeStore.statistics = [
        { title: 'Tasks', value: '0', source: 'tasks' },
        { title: 'Users', value: '0', source: 'account' },
      ];
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      axios.get.mockImplementation(async (url) => {
        if (String(url).includes('/tasks/')) throw new Error('Failed to fetch statistics');
        return { data: { data: 1000 } };
      });

      await homeStore.getStatistics();

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(homeStore.statistics.map((i) => i.value)).toEqual(['0', 1000]);
      consoleErrorSpy.mockRestore();
    });

    it('skips, with a warning, an item whose source is not a key of api.endPoints', async () => {
      const homeStore = useHomeStore();
      homeStore.statistics = [
        { title: 'Unknown', value: '7', source: 'not-an-endpoint' },
        { title: 'Tasks', value: '0', source: 'tasks' },
      ];
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      axios.get.mockResolvedValue({ data: { data: 42 } });

      await homeStore.getStatistics();

      expect(axios.get).toHaveBeenCalledTimes(1);
      expect(axios.get.mock.calls[0][0]).toMatch(/\/tasks\/stats$/);
      expect(axios.get.mock.calls.some(([url]) => String(url).includes('not-an-endpoint'))).toBe(false);
      expect(warnSpy).toHaveBeenCalledWith(expect.any(String), expect.stringContaining('not-an-endpoint'));
      expect(homeStore.statistics.map((i) => i.value)).toEqual(['7', 42]);
      warnSpy.mockRestore();
    });

    it('does nothing when statistics are not initialised', async () => {
      const homeStore = useHomeStore();
      homeStore.statistics = null;

      await homeStore.getStatistics();

      expect(axios.get).not.toHaveBeenCalled();
      expect(homeStore.statistics).toBeNull();
    });
  });

});
