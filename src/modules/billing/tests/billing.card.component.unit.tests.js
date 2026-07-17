import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createVuetify } from 'vuetify';
import BillingCardComponent from '../components/billing.card.component.vue';
import BillingPricingFeatureSectionComponent from '../components/billing.pricingFeatureSection.component.vue';

const vuetify = createVuetify();

const mockConfig = {
  vuetify: { theme: { rounded: 'rounded-lg', flat: false } },
};

/**
 * Minimal valid item factory — caller overrides fields as needed.
 * @param {Object} overrides
 * @returns {Object}
 */
function makeItem(overrides = {}) {
  return {
    id: 'free',
    title: 'Free',
    subtitle: 'For starters',
    price: { amount: 'FREE', period: null, chip: null },
    cta: { label: 'Get started', variant: 'outlined', color: null, disabled: false, loading: false, to: null },
    info: null,
    features: [],
    badge: null,
    highlight: false,
    ...overrides,
  };
}

/**
 * Mount BillingCardComponent with Vuetify + config mock.
 * @param {Object} item
 * @returns {import('@vue/test-utils').VueWrapper}
 */
const mountComponent = (item) =>
  mount(BillingCardComponent, {
    props: { item },
    global: {
      plugins: [vuetify],
      mocks: { config: mockConfig },
    },
  });

describe('BillingCardComponent', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  // ── Renders basic fields ──────────────────────────────────────────────────

  it('renders title', () => {
    const wrapper = mountComponent(makeItem({ title: 'Growth' }));
    expect(wrapper.text()).toContain('Growth');
  });

  it('renders subtitle', () => {
    const wrapper = mountComponent(makeItem({ subtitle: 'For growing teams' }));
    expect(wrapper.text()).toContain('For growing teams');
  });

  it('renders price.amount', () => {
    const wrapper = mountComponent(makeItem({ price: { amount: '$39', period: '/month', chip: null } }));
    expect(wrapper.text()).toContain('$39');
  });

  it('renders price.period when present', () => {
    const wrapper = mountComponent(makeItem({ price: { amount: '$39', period: '/month', chip: null } }));
    expect(wrapper.text()).toContain('/month');
  });

  it('does not render price.period span when period is null', () => {
    const wrapper = mountComponent(makeItem({ price: { amount: 'FREE', period: null, chip: null } }));
    // period span uses v-if — text should not show any period string
    expect(wrapper.text()).not.toContain('/month');
    expect(wrapper.text()).not.toContain('/year');
  });

  it('renders CTA label', () => {
    const wrapper = mountComponent(makeItem({ cta: { label: 'Upgrade now', variant: 'flat', color: 'primary', disabled: false, loading: false, to: null } }));
    expect(wrapper.text()).toContain('Upgrade now');
  });

  it('renders info line when present', () => {
    const wrapper = mountComponent(makeItem({ info: 'Ops-eval: 200 operations / month' }));
    expect(wrapper.text()).toContain('Ops-eval: 200 operations / month');
  });

  it('does not render info paragraph when info is null', () => {
    const wrapper = mountComponent(makeItem({ info: null }));
    // The info line is the only `<p class="text-body-small">` on a default card (no sections,
    // no parentPlanName). Target it by class — `wrapper.find('p')` returns the always-present
    // subtitle `<p class="text-body-medium">` and would pass even if the info `v-if` were removed.
    expect(wrapper.find('p.text-body-small').exists()).toBe(false);
  });

  it('renders features list items', () => {
    const item = makeItem({
      features: [
        { icon: 'fa-solid fa-check', color: 'primary', text: 'Unlimited projects' },
        { icon: 'fa-solid fa-check', color: 'success', text: 'Priority support' },
      ],
    });
    const wrapper = mountComponent(item);
    expect(wrapper.text()).toContain('Unlimited projects');
    expect(wrapper.text()).toContain('Priority support');
  });

  // ── Badge ─────────────────────────────────────────────────────────────────

  it('renders badge chip with .billing-card__badge class when item.badge is truthy', () => {
    const wrapper = mountComponent(makeItem({ badge: 'MOST POPULAR' }));
    expect(wrapper.find('.billing-card__badge').exists()).toBe(true);
    expect(wrapper.find('.billing-card__badge').text()).toContain('MOST POPULAR');
  });

  it('does not render badge chip when item.badge is null', () => {
    const wrapper = mountComponent(makeItem({ badge: null }));
    expect(wrapper.find('.billing-card__badge').exists()).toBe(false);
  });

  // ── CTA: emit cta-click ───────────────────────────────────────────────────

  it('emits cta-click with { id } when CTA button is clicked and not disabled', async () => {
    const item = makeItem({ id: 'growth', cta: { label: 'Upgrade', variant: 'flat', color: 'primary', disabled: false, loading: false, to: null } });
    const wrapper = mountComponent(item);
    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('cta-click')).toBeTruthy();
    expect(wrapper.emitted('cta-click')[0]).toEqual([{ id: 'growth' }]);
  });

  it('does NOT emit cta-click when cta.disabled is true', async () => {
    const item = makeItem({ id: 'pro', cta: { label: 'Current Plan', variant: 'tonal', color: 'success', disabled: true, loading: false, to: null } });
    const wrapper = mountComponent(item);
    // Programmatically call onCtaClick to test guard (disabled btn blocks native click)
    await wrapper.vm.onCtaClick();
    expect(wrapper.emitted('cta-click')).toBeFalsy();
  });

  it('does NOT emit cta-click when cta.to is set (router-link handles navigation — avoid double-nav)', async () => {
    const item = makeItem({ id: 'free', cta: { label: 'Sign up', variant: 'outlined', color: null, disabled: false, loading: false, to: '/signup' } });
    const wrapper = mountComponent(item);
    // Programmatically call onCtaClick — when cta.to is present, v-btn's :to binds a
    // router-link that handles navigation natively; emitting would trigger a duplicate
    // $router.push in the parent's @cta-click handler with a possibly divergent URL.
    await wrapper.vm.onCtaClick();
    expect(wrapper.emitted('cta-click')).toBeFalsy();
  });

  // ── price.chip (annual savings) ───────────────────────────────────────────

  it('renders price.chip as a tonal v-chip when present', () => {
    const item = makeItem({
      price: {
        amount: '$33',
        period: '/month',
        chip: { text: 'Save 15%', color: 'success' },
      },
    });
    const wrapper = mountComponent(item);
    // Find the chip that is NOT the badge
    const chips = wrapper.findAllComponents({ name: 'VChip' });
    const priceChip = chips.find((c) => c.text() === 'Save 15%');
    expect(priceChip).toBeDefined();
    expect(priceChip.props('variant')).toBe('tonal');
  });

  it('does not render price.chip when chip is null', () => {
    const wrapper = mountComponent(makeItem({ price: { amount: '$39', period: '/month', chip: null } }));
    const chips = wrapper.findAllComponents({ name: 'VChip' });
    // No chip should be rendered (badge is also null by default)
    expect(chips.length).toBe(0);
  });

  // ── feature icon + color ──────────────────────────────────────────────────

  it('applies feature.icon and feature.color to list item icons', () => {
    const item = makeItem({
      features: [{ icon: 'fa-solid fa-bolt', color: 'warning', text: 'Fast execution' }],
    });
    const wrapper = mountComponent(item);
    const icon = wrapper.findComponent({ name: 'VIcon' });
    expect(icon.props('icon')).toBe('fa-solid fa-bolt');
    expect(icon.props('color')).toBe('warning');
  });

  it('falls back to fa-solid fa-check icon when feature.icon is absent', () => {
    const item = makeItem({
      features: [{ text: 'Basic feature' }],
    });
    const wrapper = mountComponent(item);
    const icon = wrapper.findComponent({ name: 'VIcon' });
    expect(icon.props('icon')).toBe('fa-solid fa-check');
  });
});

// ── Grouped feature sections + plan inheritance ──────────────────────────────

describe('BillingCardComponent — grouped feature sections', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders one BillingPricingFeatureSectionComponent per section', () => {
    const item = makeItem({
      features: [],
      sections: [
        { title: 'Core', items: [{ text: 'A' }] },
        { title: 'Collaboration', items: [{ text: 'B' }] },
      ],
    });
    const wrapper = mountComponent(item);
    expect(wrapper.findAllComponents(BillingPricingFeatureSectionComponent)).toHaveLength(2);
    expect(wrapper.text()).toContain('A');
    expect(wrapper.text()).toContain('B');
  });

  it('passes each section through to the section component as the `section` prop', () => {
    const sections = [{ title: 'Core', items: [{ text: 'A' }] }];
    const item = makeItem({ features: [], sections });
    const wrapper = mountComponent(item);
    const section = wrapper.findComponent(BillingPricingFeatureSectionComponent);
    expect(section.props('section')).toEqual(sections[0]);
  });

  it('renders the plan-level inheritance heading ONCE when item.parentPlanName is set', () => {
    const item = makeItem({
      features: [],
      inheritsFrom: 'starter',
      parentPlanName: 'Starter',
      // sections carry plain titles (no section-level inheritsFrom) so the only
      // "Everything in …" heading comes from the card-level <p>.
      sections: [{ title: 'Pro only', items: [{ text: 'Advanced analytics' }] }],
    });
    const wrapper = mountComponent(item);
    const text = wrapper.text();
    expect(text).toContain('Everything in Starter, plus');
    // Exactly one occurrence (rendered once above the sections, not per section).
    expect(text.split('Everything in Starter, plus')).toHaveLength(2);
  });

  it('does NOT forward parentPlanName to section components — the card owns the single plan-level heading', () => {
    // Regression guard for the double-heading footgun: the card renders the
    // "Everything in {parent}, plus" heading ONCE at plan level and must not pass parentPlanName
    // down, or a section that declares `inheritsFrom` would emit a second identical heading.
    const item = makeItem({
      features: [],
      inheritsFrom: 'starter',
      parentPlanName: 'Starter',
      // A section that DECLARES inheritsFrom must still NOT produce a second heading, because the
      // card no longer forwards parentPlanName (section.resolvedHeading stays null without it).
      sections: [{ inheritsFrom: 'starter', items: [{ text: 'Inherited feature' }] }],
    });
    const wrapper = mountComponent(item);
    const section = wrapper.findComponent(BillingPricingFeatureSectionComponent);
    expect(section.props('parentPlanName')).toBe(null);
    // The inheritance heading appears exactly once (plan-level), never duplicated by the section.
    expect(wrapper.text().split('Everything in Starter, plus')).toHaveLength(2);
  });

  it('does NOT render the flat features v-list when sections are present', () => {
    const item = makeItem({
      // Even if a stray flat `features` array is present, sections take precedence.
      features: [{ icon: 'fa-solid fa-check', color: 'primary', text: 'Stray flat feature' }],
      sections: [{ title: 'Core', items: [{ text: 'Section feature' }] }],
    });
    const wrapper = mountComponent(item);
    expect(wrapper.findAllComponents(BillingPricingFeatureSectionComponent)).toHaveLength(1);
    expect(wrapper.text()).toContain('Section feature');
    expect(wrapper.text()).not.toContain('Stray flat feature');
  });
});

describe('BillingCardComponent — flat fallback (no sections)', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders the flat v-list and NO section components when only features are given', () => {
    const item = makeItem({
      features: [
        { icon: 'fa-solid fa-check', color: 'primary', text: 'Flat feature one' },
        { icon: 'fa-solid fa-check', color: 'success', text: 'Flat feature two' },
      ],
    });
    const wrapper = mountComponent(item);
    expect(wrapper.text()).toContain('Flat feature one');
    expect(wrapper.text()).toContain('Flat feature two');
    expect(wrapper.findAllComponents(BillingPricingFeatureSectionComponent)).toHaveLength(0);
  });

  it('falls back to the flat features list when sections is an empty array', () => {
    // Guard `item.sections && item.sections.length > 0`: an empty array is truthy but
    // length-0, so the flat fallback must still run (and no section components mount).
    const item = makeItem({
      features: [{ icon: 'fa-solid fa-check', color: 'primary', text: 'Flat only feature' }],
      sections: [],
    });
    const wrapper = mountComponent(item);
    expect(wrapper.text()).toContain('Flat only feature');
    expect(wrapper.findAllComponents(BillingPricingFeatureSectionComponent)).toHaveLength(0);
  });
});

describe('BillingCardComponent — inheritance edge cases', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('does not render the inheritance heading (and does not crash) when inheritsFrom is set but parentPlanName is null', () => {
    const item = makeItem({
      features: [],
      inheritsFrom: 'starter',
      parentPlanName: null,
      sections: [{ title: 'Pro only', items: [{ text: 'A' }] }],
    });
    const wrapper = mountComponent(item);
    expect(wrapper.text()).not.toContain('Everything in');
    // Sections still render fine.
    expect(wrapper.findAllComponents(BillingPricingFeatureSectionComponent)).toHaveLength(1);
  });

  it('renders without crashing when neither sections nor features are present', () => {
    const item = makeItem({ features: [], sections: undefined });
    const wrapper = mountComponent(item);
    expect(wrapper.find('.billing-card').exists()).toBe(true);
    expect(wrapper.findAllComponents(BillingPricingFeatureSectionComponent)).toHaveLength(0);
    // Title still rendered — card body is intact.
    expect(wrapper.text()).toContain('Free');
  });
});
