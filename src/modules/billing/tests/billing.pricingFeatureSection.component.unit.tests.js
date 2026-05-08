/**
 * Unit tests for BillingPricingFeatureSectionComponent.
 */
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import { createI18n } from 'vue-i18n';
import BillingPricingFeatureSectionComponent from '../components/billing.pricingFeatureSection.component.vue';

const vuetify = createVuetify();
const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      billing: {
        pricingFeatureSection: {
          everythingIn: 'Everything in {plan}, plus',
        },
      },
    },
  },
});

describe('BillingPricingFeatureSectionComponent', () => {
  it('renders title when provided', () => {
    const wrapper = mount(BillingPricingFeatureSectionComponent, {
      props: {
        section: { title: 'Core', items: [{ text: 'A' }, { text: 'B' }] },
        parentPlanName: null,
      },
      global: { plugins: [vuetify, i18n] },
    });
    expect(wrapper.text()).toContain('Core');
  });

  it('does not render title when section.title is null', () => {
    const wrapper = mount(BillingPricingFeatureSectionComponent, {
      props: {
        section: { title: null, items: [{ text: 'A' }] },
        parentPlanName: null,
      },
      global: { plugins: [vuetify, i18n] },
    });
    expect(wrapper.find('.billing-pricing-feature-section__title').exists()).toBe(false);
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
      global: { plugins: [vuetify, i18n] },
    });
    expect(wrapper.text()).toContain('Everything in Starter, plus');
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
      global: { plugins: [vuetify, i18n] },
    });
    expect(wrapper.text()).toContain('A');
    expect(wrapper.text()).toContain('B');
    expect(wrapper.findAll('.v-icon')).toHaveLength(2);
  });

  it('applies highlight class to items flagged highlight=true', () => {
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
      global: { plugins: [vuetify, i18n] },
    });
    const highlighted = wrapper.findAll('.billing-pricing-feature-section__item--highlight');
    expect(highlighted).toHaveLength(1);
    expect(highlighted[0].text()).toContain('Highlighted');
  });

  it('applies iconColor when provided (Vuetify color name)', () => {
    const wrapper = mount(BillingPricingFeatureSectionComponent, {
      props: {
        section: { title: null, items: [{ text: 'A', iconColor: 'success' }] },
        parentPlanName: null,
      },
      global: { plugins: [vuetify, i18n] },
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
      global: { plugins: [vuetify, i18n] },
    });
    const icon = wrapper.find('.v-icon');
    // Hex colors render as inline style
    expect(icon.attributes('style') || '').toMatch(/#ff6b6b/i);
  });

  it('falls back to primary color when iconColor is absent', () => {
    const wrapper = mount(BillingPricingFeatureSectionComponent, {
      props: {
        section: { title: null, items: [{ text: 'A' }] },
        parentPlanName: null,
      },
      global: { plugins: [vuetify, i18n] },
    });
    expect(wrapper.find('.v-icon').classes()).toContain('text-primary');
  });

  it('applies disabled class to items with enabled=false', () => {
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
      global: { plugins: [vuetify, i18n] },
    });
    const disabled = wrapper.findAll('.billing-pricing-feature-section__item--disabled');
    expect(disabled).toHaveLength(1);
    expect(disabled[0].text()).toContain('Disabled feature');
  });

  it('treats absent enabled as enabled (default true)', () => {
    const wrapper = mount(BillingPricingFeatureSectionComponent, {
      props: {
        section: {
          title: null,
          items: [{ text: 'Default item' }],
        },
        parentPlanName: null,
      },
      global: { plugins: [vuetify, i18n] },
    });
    expect(wrapper.find('.billing-pricing-feature-section__item--disabled').exists()).toBe(false);
  });
});
