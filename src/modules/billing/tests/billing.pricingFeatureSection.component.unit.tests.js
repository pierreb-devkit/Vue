/**
 * Unit tests for BillingPricingFeatureSectionComponent.
 */
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import BillingPricingFeatureSectionComponent from '../components/billing.pricingFeatureSection.component.vue';

const vuetify = createVuetify();

describe('BillingPricingFeatureSectionComponent', () => {
  it('renders title when provided', () => {
    const wrapper = mount(BillingPricingFeatureSectionComponent, {
      props: {
        section: { title: 'Core', items: [{ text: 'A' }, { text: 'B' }] },
        parentPlanName: null,
      },
      global: { plugins: [vuetify] },
    });
    expect(wrapper.text()).toContain('Core');
  });

  it('does not render title when section.title is null', () => {
    const wrapper = mount(BillingPricingFeatureSectionComponent, {
      props: {
        section: { title: null, items: [{ text: 'A' }] },
        parentPlanName: null,
      },
      global: { plugins: [vuetify] },
    });
    expect(wrapper.find('h4').exists()).toBe(false);
  });

  it('renders inheritsFrom heading when section has inheritsFrom and parentPlanName is provided', () => {
    const wrapper = mount(BillingPricingFeatureSectionComponent, {
      props: {
        section: {
          title: null,
          inheritsFrom: 'starter',
          items: [{ text: 'Pro feature' }],
        },
        parentPlanName: 'Starter',
      },
      global: { plugins: [vuetify] },
    });
    expect(wrapper.text()).toContain('Everything in Starter, plus');
  });

  it('renders introText when provided (priority over inheritsFrom)', () => {
    const wrapper = mount(BillingPricingFeatureSectionComponent, {
      props: {
        section: { introText: 'Get started with:', items: [{ text: 'A' }] },
        parentPlanName: null,
      },
      global: { plugins: [vuetify] },
    });
    expect(wrapper.text()).toContain('Get started with:');
  });

  it('introText takes priority over inheritsFrom when both are present', () => {
    const wrapper = mount(BillingPricingFeatureSectionComponent, {
      props: {
        section: { introText: 'Custom intro', inheritsFrom: 'starter', items: [{ text: 'A' }] },
        parentPlanName: 'Starter',
      },
      global: { plugins: [vuetify] },
    });
    expect(wrapper.text()).toContain('Custom intro');
    expect(wrapper.text()).not.toContain('Everything in Starter');
  });

  it('renders all items with text + icon when provided', () => {
    const wrapper = mount(BillingPricingFeatureSectionComponent, {
      props: {
        section: {
          title: null,
          items: [
            { text: 'A', icon: 'fa-solid fa-check' },
            { text: 'B', icon: 'fa-solid fa-star' },
          ],
        },
        parentPlanName: null,
      },
      global: { plugins: [vuetify] },
    });
    expect(wrapper.text()).toContain('A');
    expect(wrapper.text()).toContain('B');
    expect(wrapper.findAll('.v-icon')).toHaveLength(2);
  });

  it('renders highlight rows as bold primary text with no leading icon', () => {
    const wrapper = mount(BillingPricingFeatureSectionComponent, {
      props: {
        section: {
          title: null,
          items: [
            { text: 'Normal', highlight: false },
            { text: 'Highlighted', highlight: true },
          ],
        },
        parentPlanName: null,
      },
      global: { plugins: [vuetify] },
    });
    const highlighted = wrapper.find('.font-weight-bold');
    expect(highlighted.exists()).toBe(true);
    expect(highlighted.text()).toContain('Highlighted');
    expect(highlighted.classes()).toContain('text-primary');
    // Highlight rows are iconless — only the single normal row renders a check icon.
    expect(wrapper.findAll('.v-icon')).toHaveLength(1);
  });

  it('applies iconColor when provided (Vuetify color name)', () => {
    const wrapper = mount(BillingPricingFeatureSectionComponent, {
      props: {
        section: { title: null, items: [{ text: 'A', iconColor: 'success' }] },
        parentPlanName: null,
      },
      global: { plugins: [vuetify] },
    });
    const icon = wrapper.find('.v-icon');
    expect(icon.exists()).toBe(true);
    // Vuetify renders color via the `text-success` class for named colors
    expect(icon.classes()).toContain('text-success');
  });

  it('applies iconColor when provided (hex string)', () => {
    const wrapper = mount(BillingPricingFeatureSectionComponent, {
      props: {
        section: { title: null, items: [{ text: 'A', iconColor: '#ff6b6b' }] },
        parentPlanName: null,
      },
      global: { plugins: [vuetify] },
    });
    const icon = wrapper.find('.v-icon');
    // Hex colors render as inline style
    expect(icon.attributes('style') || '').toMatch(/#ff6b6b/i);
  });

  it('uses item.color as a back-compat alias when iconColor is absent', () => {
    const wrapper = mount(BillingPricingFeatureSectionComponent, {
      props: {
        section: { title: null, items: [{ text: 'A', color: 'success' }] },
        parentPlanName: null,
      },
      global: { plugins: [vuetify] },
    });
    // `color` (the flat-features key) is honored when `iconColor` is absent —
    // eases a flat→grouped migration that kept its `color` keys.
    expect(wrapper.find('.v-icon').classes()).toContain('text-success');
  });

  it('prefers iconColor over color when both are present', () => {
    const wrapper = mount(BillingPricingFeatureSectionComponent, {
      props: {
        section: { title: null, items: [{ text: 'A', iconColor: 'success', color: 'error' }] },
        parentPlanName: null,
      },
      global: { plugins: [vuetify] },
    });
    expect(wrapper.find('.v-icon').classes()).toContain('text-success');
  });

  it('falls back to primary color when iconColor is absent', () => {
    const wrapper = mount(BillingPricingFeatureSectionComponent, {
      props: {
        section: { title: null, items: [{ text: 'A' }] },
        parentPlanName: null,
      },
      global: { plugins: [vuetify] },
    });
    expect(wrapper.find('.v-icon').classes()).toContain('text-primary');
  });

  it('renders enabled=false rows with an ✗ (xmark) icon and dimmed text', () => {
    const wrapper = mount(BillingPricingFeatureSectionComponent, {
      props: {
        section: {
          title: null,
          items: [
            { text: 'Enabled feature', enabled: true },
            { text: 'Disabled feature', enabled: false },
          ],
        },
        parentPlanName: null,
      },
      global: { plugins: [vuetify] },
    });
    // enabled:false swaps the check for an explicit not-included ✗ marker.
    expect(wrapper.html()).toContain('fa-xmark');
    // ...and dims the label so the row reads as "not in this plan".
    const dimmed = wrapper.findAll('.text-medium-emphasis').filter((el) => el.text().includes('Disabled feature'));
    expect(dimmed.length).toBeGreaterThan(0);
  });

  it('treats absent enabled as enabled — no xmark, no dimming', () => {
    const wrapper = mount(BillingPricingFeatureSectionComponent, {
      props: {
        section: {
          title: null,
          items: [{ text: 'Default item' }],
        },
        parentPlanName: null,
      },
      global: { plugins: [vuetify] },
    });
    expect(wrapper.html()).not.toContain('fa-xmark');
    expect(wrapper.find('.text-medium-emphasis').exists()).toBe(false);
  });
});
