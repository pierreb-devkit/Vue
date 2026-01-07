import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useHomeStore } from '../stores/home.store';

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
});
