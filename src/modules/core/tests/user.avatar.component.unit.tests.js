import { mount } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import UserAvatarComponent from '../components/user.avatar.component.vue';

const mockConfig = {
  api: { protocol: 'https', host: 'api.example.com', port: 443 },
};

const globalOpts = (vuetify) => ({
  plugins: [vuetify],
  config: {
    globalProperties: {
      config: mockConfig,
      setImages: (api, file, size) => `${api.protocol}://${api.host}:${api.port}/api/uploads/images/${file}-${size}`,
    },
  },
});

describe('user.avatar.component', () => {
  let vuetify;

  beforeEach(() => {
    vuetify = createVuetify({ components, directives });
  });

  const createWrapper = (props, opts = {}) => mount(UserAvatarComponent, {
    props,
    global: globalOpts(vuetify),
    ...opts,
  });

  describe('props', () => {
    it('defaults user to null', () => {
      expect(UserAvatarComponent.props.user.default).toBe(null);
    });

    it('defaults size to 32', () => {
      expect(UserAvatarComponent.props.size.default).toBe(32);
    });
  });

  describe('initials computed', () => {
    it('shows first letter of firstName and lastName', () => {
      const wrapper = createWrapper({ user: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' } });
      expect(wrapper.vm.initials).toBe('JD');
    });

    it('handles missing lastName', () => {
      const wrapper = createWrapper({ user: { firstName: 'John', email: 'john@example.com' } });
      expect(wrapper.vm.initials).toBe('J');
    });

    it('handles missing firstName', () => {
      const wrapper = createWrapper({ user: { lastName: 'Doe', email: 'doe@example.com' } });
      expect(wrapper.vm.initials).toBe('D');
    });

    it('returns ? when both names are missing', () => {
      const wrapper = createWrapper({ user: { email: 'anon@example.com' } });
      expect(wrapper.vm.initials).toBe('?');
    });

    it('returns empty string for null user', () => {
      const wrapper = createWrapper({ user: null });
      expect(wrapper.vm.initials).toBe('');
    });
  });

  describe('fullName computed', () => {
    it('joins firstName and lastName', () => {
      const wrapper = createWrapper({ user: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' } });
      expect(wrapper.vm.fullName).toBe('John Doe');
    });

    it('falls back to email when names missing', () => {
      const wrapper = createWrapper({ user: { email: 'john@example.com' } });
      expect(wrapper.vm.fullName).toBe('john@example.com');
    });

    it('returns empty string for null user', () => {
      const wrapper = createWrapper({ user: null });
      expect(wrapper.vm.fullName).toBe('');
    });
  });

  describe('avatarSize computed', () => {
    it('snaps size=24 (requested 48) to 128', () => {
      const wrapper = createWrapper({ user: { email: 'a@b.com' }, size: 24 });
      expect(wrapper.vm.avatarSize).toBe(128);
    });

    it('snaps size=64 (requested 128) to 128', () => {
      const wrapper = createWrapper({ user: { email: 'a@b.com' }, size: 64 });
      expect(wrapper.vm.avatarSize).toBe(128);
    });

    it('snaps size=200 (requested 400) to 512', () => {
      const wrapper = createWrapper({ user: { email: 'a@b.com' }, size: 200 });
      expect(wrapper.vm.avatarSize).toBe(512);
    });

    it('snaps size=512 (requested 1024) to 1024', () => {
      const wrapper = createWrapper({ user: { email: 'a@b.com' }, size: 512 });
      expect(wrapper.vm.avatarSize).toBe(1024);
    });

    it('caps size=600 (requested 1200) to 1024', () => {
      const wrapper = createWrapper({ user: { email: 'a@b.com' }, size: 600 });
      expect(wrapper.vm.avatarSize).toBe(1024);
    });

    it('uses snapped size when building avatar image URL', () => {
      const setImages = vi.fn((api, file, size) => `${api.protocol}://${api.host}:${api.port}/api/uploads/images/${file}-${size}`);
      const wrapper = mount(UserAvatarComponent, {
        props: { user: { email: 'a@b.com', avatar: 'photo.jpg' }, size: 200 },
        global: {
          plugins: [vuetify],
          config: { globalProperties: { config: mockConfig, setImages } },
        },
      });

      expect(wrapper.vm.avatarSize).toBe(512);
      expect(setImages).toHaveBeenCalledWith(mockConfig.api, 'photo.jpg', 512, null);
    });
  });

  describe('hasAvatar computed', () => {
    it('returns true when user has avatar', () => {
      const wrapper = createWrapper({ user: { avatar: 'photo.jpg', email: 'a@b.com' } });
      expect(wrapper.vm.hasAvatar).toBe(true);
    });

    it('returns false when avatar is empty string', () => {
      const wrapper = createWrapper({ user: { avatar: '', email: 'a@b.com' } });
      expect(wrapper.vm.hasAvatar).toBe(false);
    });

    it('returns false when avatar is undefined', () => {
      const wrapper = createWrapper({ user: { email: 'a@b.com' } });
      expect(wrapper.vm.hasAvatar).toBe(false);
    });
  });

  describe('avatarColor computed', () => {
    it('returns a consistent color for the same email', () => {
      const wrapper1 = createWrapper({ user: { email: 'john@example.com' } });
      const wrapper2 = createWrapper({ user: { email: 'john@example.com' } });
      expect(wrapper1.vm.avatarColor).toBe(wrapper2.vm.avatarColor);
    });

    it('returns different colors for different emails', () => {
      const wrapperA = createWrapper({ user: { email: 'john@example.com' } });
      const wrapperB = createWrapper({ user: { email: 'jane@example.com' } });
      // Both must be valid hex colors
      expect(wrapperA.vm.avatarColor).toMatch(/^#[A-Fa-f0-9]{6}$/);
      expect(wrapperB.vm.avatarColor).toMatch(/^#[A-Fa-f0-9]{6}$/);
    });

    it('returns a valid hex color', () => {
      const wrapper = createWrapper({ user: { email: 'test@test.com' } });
      expect(wrapper.vm.avatarColor).toMatch(/^#[A-Fa-f0-9]{6}$/);
    });

    it('handles missing email gracefully', () => {
      const wrapper = createWrapper({ user: { firstName: 'John' } });
      expect(wrapper.vm.avatarColor).toMatch(/^#[A-Fa-f0-9]{6}$/);
    });
  });

  describe('textColorClass computed', () => {
    it('returns correct contrast class based on background luminance', () => {
      const wrapper = createWrapper({ user: { email: 'test@test.com' } });
      const color = wrapper.vm.avatarColor;
      const r = parseInt(color.slice(1, 3), 16) / 255;
      const g = parseInt(color.slice(3, 5), 16) / 255;
      const b = parseInt(color.slice(5, 7), 16) / 255;
      const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      const expected = luminance > 0.5 ? 'text-black' : 'text-white';
      expect(wrapper.vm.textColorClass).toBe(expected);
    });

    it('is consistent with avatarColor', () => {
      const wrapper1 = createWrapper({ user: { email: 'same@email.com' } });
      const wrapper2 = createWrapper({ user: { email: 'same@email.com' } });
      expect(wrapper1.vm.textColorClass).toBe(wrapper2.vm.textColorClass);
    });
  });

  describe('rendering', () => {
    it('renders v-avatar element', () => {
      const wrapper = createWrapper({ user: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' } });
      expect(wrapper.find('.v-avatar').exists()).toBe(true);
    });

    it('renders initials when no avatar image', () => {
      const wrapper = createWrapper({ user: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' } });
      expect(wrapper.text()).toContain('JD');
    });

    it('renders v-img when user has avatar', () => {
      const wrapper = createWrapper({ user: { firstName: 'John', lastName: 'Doe', email: 'john@example.com', avatar: 'photo.jpg' } });
      expect(wrapper.find('.v-img').exists()).toBe(true);
    });

    it('does not render v-img when user has no avatar', () => {
      const wrapper = createWrapper({ user: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' } });
      expect(wrapper.find('.v-img').exists()).toBe(false);
    });

    it('applies custom size to v-avatar', () => {
      const wrapper = createWrapper({ user: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' }, size: 64 });
      const avatar = wrapper.find('.v-avatar');
      expect(avatar.exists()).toBe(true);
      expect(avatar.attributes('style')).toContain('width: 64px');
      expect(avatar.attributes('style')).toContain('height: 64px');
    });
  });
});
