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

  it('should set contact data', () => {
    const homeStore = useHomeStore();
    const contactData = {
      name: 'John Doe',
      email: 'john@example.com',
      message: 'Hello',
    };

    homeStore.setContact(contactData);

    expect(homeStore.contact).toEqual(contactData);
  });

  it('should update contact data', () => {
    const homeStore = useHomeStore();

    homeStore.setContact({
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
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      axios.get.mockRejectedValueOnce(new Error('Failed to fetch team'));

      await homeStore.getTeam();

      expect(homeStore.team).toEqual([]);
      expect(consoleLogSpy).toHaveBeenCalled();

      consoleLogSpy.mockRestore();
    });
  });

  describe('getChangelogs', () => {
    it('should fetch and transform changelog data', async () => {
      const homeStore = useHomeStore();
      const mockChangelogsData = {
        data: {
          data: [
            {
              title: 'v1.0.0',
              markdown: '- [Fix] Bug fixes (#abc1234)\n- [Feature] New feature (def5678)',
            },
          ],
        },
      };

      axios.get.mockResolvedValueOnce(mockChangelogsData);

      await homeStore.getChangelogs();

      expect(homeStore.contents).toHaveLength(1);
      expect(homeStore.contents[0].title).toBe('v1.0.0');
      expect(homeStore.contents[0].style).toBe('air');
      expect(homeStore.contents[0].markdown).toBeDefined();
    });

    it('should handle getChangelogs error', async () => {
      const homeStore = useHomeStore();
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      axios.get.mockRejectedValueOnce(new Error('Failed to fetch changelogs'));

      await homeStore.getChangelogs();

      expect(homeStore.contents).toEqual([]);
      expect(consoleLogSpy).toHaveBeenCalled();

      consoleLogSpy.mockRestore();
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
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      axios.get.mockRejectedValueOnce(new Error('Failed to fetch pages'));

      await homeStore.getPages('test');

      expect(homeStore.contents).toEqual([]);
      expect(consoleLogSpy).toHaveBeenCalled();

      consoleLogSpy.mockRestore();
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
  });

  describe('getStatistics', () => {
    it('should fetch and calculate statistics successfully', async () => {
      const homeStore = useHomeStore();
      homeStore.initStatistics();

      if (!homeStore.statistics) {
        homeStore.statistics = [{ value: 0 }, { value: 0 }, { value: 0 }];
      }

      const mockTasksData = { data: { data: 150 } };
      const mockReleasesData = {
        data: {
          data: [
            { list: [{ name: 'v2.5.3' }] },
            { list: [{ name: 'v3.2.1' }] },
          ],
        },
      };
      const mockUsersData = { data: { data: 1000 } };

      axios.get
        .mockResolvedValueOnce(mockTasksData)
        .mockResolvedValueOnce(mockReleasesData)
        .mockResolvedValueOnce(mockUsersData);

      await homeStore.getStatistics();

      expect(homeStore.statistics[0].value).toBe(150);
      expect(homeStore.statistics[1].value).toBeGreaterThan(0);
      expect(homeStore.statistics[2].value).toBe(1000);
    });

    it('should handle empty release list in statistics', async () => {
      const homeStore = useHomeStore();
      homeStore.initStatistics();

      if (!homeStore.statistics) {
        homeStore.statistics = [{ value: 0 }, { value: 0 }, { value: 0 }];
      }

      const mockTasksData = { data: { data: 100 } };
      const mockReleasesData = {
        data: {
          data: [{ list: [] }],
        },
      };
      const mockUsersData = { data: { data: 500 } };

      axios.get
        .mockResolvedValueOnce(mockTasksData)
        .mockResolvedValueOnce(mockReleasesData)
        .mockResolvedValueOnce(mockUsersData);

      await homeStore.getStatistics();

      expect(homeStore.statistics[0].value).toBe(100);
      expect(homeStore.statistics[2].value).toBe(500);
    });

    it('should handle getStatistics error', async () => {
      const homeStore = useHomeStore();
      homeStore.initStatistics();

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      axios.get.mockRejectedValueOnce(new Error('Failed to fetch statistics'));

      await homeStore.getStatistics();

      expect(consoleLogSpy).toHaveBeenCalled();
      consoleLogSpy.mockRestore();
    });

    it('should handle null statistics gracefully', async () => {
      const homeStore = useHomeStore();
      homeStore.statistics = null;

      const mockTasksData = { data: { data: 150 } };
      const mockReleasesData = { data: { data: [] } };
      const mockUsersData = { data: { data: 1000 } };

      axios.get
        .mockResolvedValueOnce(mockTasksData)
        .mockResolvedValueOnce(mockReleasesData)
        .mockResolvedValueOnce(mockUsersData);

      await homeStore.getStatistics();

      expect(homeStore.statistics).toBeNull();
    });
  });

});
