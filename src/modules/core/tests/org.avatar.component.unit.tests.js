import { mount } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { describe, it, expect } from 'vitest';
import OrgAvatar from '../components/org.avatar.component.vue';
import orgColor from '../../../lib/helpers/orgColor';

const globalOpts = (vuetify) => ({
  plugins: [vuetify],
});

describe('org.avatar.component', () => {
  const vuetify = createVuetify({ components, directives });

  it('renders the first letter of the org name uppercased', () => {
    const wrapper = mount(OrgAvatar, {
      props: { org: { name: 'acme' } },
      global: globalOpts(vuetify),
    });
    expect(wrapper.text()).toContain('A');
  });

  it('applies the deterministic orgColor to the avatar', () => {
    const org = { name: 'acme' };
    const wrapper = mount(OrgAvatar, {
      props: { org },
      global: globalOpts(vuetify),
    });
    const avatar = wrapper.findComponent({ name: 'VAvatar' });
    expect(avatar.props('color')).toBe(orgColor(org));
  });

  it('uses default size of 32', () => {
    const wrapper = mount(OrgAvatar, {
      props: { org: { name: 'test' } },
      global: globalOpts(vuetify),
    });
    const avatar = wrapper.findComponent({ name: 'VAvatar' });
    expect(avatar.props('size')).toBe(32);
  });

  it('accepts a custom size prop', () => {
    const wrapper = mount(OrgAvatar, {
      props: { org: { name: 'test' }, size: 48 },
      global: globalOpts(vuetify),
    });
    const avatar = wrapper.findComponent({ name: 'VAvatar' });
    expect(avatar.props('size')).toBe(48);
  });

  it('falls back to "?" when org name is missing', () => {
    const wrapper = mount(OrgAvatar, {
      props: { org: {} },
      global: globalOpts(vuetify),
    });
    expect(wrapper.text()).toContain('?');
  });

  it('uses text-body-large class for size >= 36', () => {
    const wrapper = mount(OrgAvatar, {
      props: { org: { name: 'big' }, size: 40 },
      global: globalOpts(vuetify),
    });
    expect(wrapper.find('.text-body-large').exists()).toBe(true);
  });

  it('uses text-label-small class for size < 28', () => {
    const wrapper = mount(OrgAvatar, {
      props: { org: { name: 'small' }, size: 24 },
      global: globalOpts(vuetify),
    });
    expect(wrapper.find('.text-label-small').exists()).toBe(true);
  });

  it('uses text-body-medium class for size between 28 and 35', () => {
    const wrapper = mount(OrgAvatar, {
      props: { org: { name: 'mid' }, size: 32 },
      global: globalOpts(vuetify),
    });
    expect(wrapper.find('.text-body-medium').exists()).toBe(true);
  });

  it('produces consistent color for same org name', () => {
    const org = { name: 'consistent' };
    const w1 = mount(OrgAvatar, { props: { org }, global: globalOpts(vuetify) });
    const w2 = mount(OrgAvatar, { props: { org }, global: globalOpts(vuetify) });
    const c1 = w1.findComponent({ name: 'VAvatar' }).props('color');
    const c2 = w2.findComponent({ name: 'VAvatar' }).props('color');
    expect(c1).toBe(c2);
  });
});
