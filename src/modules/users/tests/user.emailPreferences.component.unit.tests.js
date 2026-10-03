import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import userEmailPreferences from '../components/user.emailPreferences.component.vue';

const vuetify = createVuetify({ components, directives });

/**
 * Mount UserEmailPreferencesComponent with Vuetify.
 * @param {object} [props={}] - Props merged into the default user prop set.
 * @returns {import('@vue/test-utils').VueWrapper} Fully mounted wrapper.
 */
const mountPrefs = (props = {}) =>
  mount(userEmailPreferences, {
    global: { plugins: [vuetify] },
    props: { user: {}, ...props },
  });

const getSwitches = (wrapper) => wrapper.findAllComponents({ name: 'VSwitch' });

describe('user.emailPreferences.component — defaults', () => {
  it('renders both switches ON when the user has no emailPreferences at all', () => {
    const wrapper = mountPrefs({ user: {} });
    const switches = getSwitches(wrapper);
    expect(switches).toHaveLength(2);
    expect(switches[0].props('modelValue')).toBe(true);
    expect(switches[1].props('modelValue')).toBe(true);
  });

  it('reflects a stored false for one kind without flipping the other', () => {
    const wrapper = mountPrefs({ user: { emailPreferences: { onboarding: false, news: true } } });
    const switches = getSwitches(wrapper);
    expect(switches[0].props('modelValue')).toBe(false);
    expect(switches[1].props('modelValue')).toBe(true);
  });

  it('labels the switches Onboarding emails / News and product updates', () => {
    const wrapper = mountPrefs();
    const labels = getSwitches(wrapper).map((s) => s.props('label'));
    expect(labels).toContain('Onboarding emails');
    expect(labels).toContain('News and product updates');
  });

  it('does not render a switch for transactional email', () => {
    const wrapper = mountPrefs();
    expect(wrapper.text()).not.toMatch(/transactional/i);
  });
});

describe('user.emailPreferences.component — toggle emits full payload', () => {
  it('toggling onboarding off emits save with news left on (both keys always sent)', async () => {
    const wrapper = mountPrefs({ user: { emailPreferences: { onboarding: true, news: true } } });
    const [onboardingSwitch] = getSwitches(wrapper);

    await onboardingSwitch.vm.$emit('update:modelValue', false);

    const emitted = wrapper.emitted('save');
    expect(emitted).toBeTruthy();
    expect(emitted[0][0]).toEqual({ onboarding: false, news: true });
  });

  it('toggling news off emits save with onboarding left on, even starting from a false onboarding', async () => {
    const wrapper = mountPrefs({ user: { emailPreferences: { onboarding: false, news: true } } });
    const [, newsSwitch] = getSwitches(wrapper);

    await newsSwitch.vm.$emit('update:modelValue', false);

    const emitted = wrapper.emitted('save');
    expect(emitted[0][0]).toEqual({ onboarding: false, news: false });
  });

  it('toggling from a wholly-absent emailPreferences still emits both keys explicitly', async () => {
    const wrapper = mountPrefs({ user: {} });
    const [onboardingSwitch] = getSwitches(wrapper);

    await onboardingSwitch.vm.$emit('update:modelValue', false);

    expect(wrapper.emitted('save')[0][0]).toEqual({ onboarding: false, news: true });
  });
});

describe('user.emailPreferences.component — saving state disables the switches', () => {
  it('disables both switches when saving is true', () => {
    const wrapper = mountPrefs({ saving: true });
    const switches = getSwitches(wrapper);
    expect(switches[0].props('disabled')).toBe(true);
    expect(switches[1].props('disabled')).toBe(true);
  });

  it('leaves both switches enabled when saving is false (default)', () => {
    const wrapper = mountPrefs();
    const switches = getSwitches(wrapper);
    expect(switches[0].props('disabled')).toBe(false);
    expect(switches[1].props('disabled')).toBe(false);
  });
});

describe('user.emailPreferences.component — accessibility', () => {
  it('wraps both switches in a role="group" labelled by the Emails heading', () => {
    const wrapper = mountPrefs();
    const headingId = wrapper.find('h3').attributes('id');
    expect(headingId).toBeTruthy();

    const group = wrapper.find('[role="group"]');
    expect(group.exists()).toBe(true);
    expect(group.attributes('aria-labelledby')).toBe(headingId);

    const switches = getSwitches(wrapper);
    switches.forEach((s) => expect(group.element.contains(s.element)).toBe(true));
  });
});

describe('user.emailPreferences.component — controlled by the user prop (save confirms, failure reverts)', () => {
  it('reflects the new value once the parent confirms it on the user prop (save succeeds)', async () => {
    const wrapper = mountPrefs({ user: { emailPreferences: { onboarding: true, news: true } } });

    await wrapper.setProps({ user: { emailPreferences: { onboarding: false, news: true } } });

    const [onboardingSwitch] = getSwitches(wrapper);
    expect(onboardingSwitch.props('modelValue')).toBe(false);
  });

  it('snaps back to the prior value when the parent reverts the user prop (save fails)', async () => {
    const wrapper = mountPrefs({ user: { emailPreferences: { onboarding: true, news: true } } });

    // Parent optimistically mirrors the toggle onto the prop...
    await wrapper.setProps({ user: { emailPreferences: { onboarding: false, news: true } } });
    // ...then reverts it after the PUT rejects.
    await wrapper.setProps({ user: { emailPreferences: { onboarding: true, news: true } } });

    const [onboardingSwitch] = getSwitches(wrapper);
    expect(onboardingSwitch.props('modelValue')).toBe(true);
  });
});
