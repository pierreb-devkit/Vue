import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import BillingEquivalencesChipsComponent from '../components/billing.equivalencesChips.component.vue';

const vuetify = createVuetify();

/**
 * Mount the equivalences chips component.
 * @param {Array} equivalences - Equivalences prop value.
 * @returns {import('@vue/test-utils').VueWrapper}
 */
const mountComponent = (equivalences) =>
  mount(BillingEquivalencesChipsComponent, {
    props: { equivalences },
    global: { plugins: [vuetify] },
  });

describe('BillingEquivalencesChipsComponent', () => {
  // ── kind: easy ──────────────────────────────────────────────────────────

  it('renders an easy chip with success color', () => {
    const wrapper = mountComponent([{ kind: 'easy', count: 500, label: 'light operations / week' }]);
    expect(wrapper.text()).toContain('500');
    expect(wrapper.text()).toContain('light operations / week');
    const chip = wrapper.findComponent({ name: 'VChip' });
    expect(chip.props('color')).toBe('success');
  });

  it('renders an easy chip with bolt icon', () => {
    const wrapper = mountComponent([{ kind: 'easy', count: 100, label: 'ops' }]);
    const chip = wrapper.findComponent({ name: 'VChip' });
    expect(chip.props('prependIcon')).toBe('fa-solid fa-bolt');
  });

  // ── kind: hard ──────────────────────────────────────────────────────────

  it('renders a hard chip with warning color', () => {
    const wrapper = mountComponent([{ kind: 'hard', count: 50, label: 'heavy operations / week' }]);
    const chip = wrapper.findComponent({ name: 'VChip' });
    expect(chip.props('color')).toBe('warning');
  });

  it('renders a hard chip with fire icon', () => {
    const wrapper = mountComponent([{ kind: 'hard', count: 50, label: 'heavy ops' }]);
    const chip = wrapper.findComponent({ name: 'VChip' });
    expect(chip.props('prependIcon')).toBe('fa-solid fa-fire');
  });

  // ── kind: feature ────────────────────────────────────────────────────────

  it('renders a feature chip with primary color', () => {
    const wrapper = mountComponent([{ kind: 'feature', count: 3, label: 'integrations' }]);
    const chip = wrapper.findComponent({ name: 'VChip' });
    expect(chip.props('color')).toBe('primary');
  });

  it('renders a feature chip with check icon', () => {
    const wrapper = mountComponent([{ kind: 'feature', count: 3, label: 'integrations' }]);
    const chip = wrapper.findComponent({ name: 'VChip' });
    expect(chip.props('prependIcon')).toBe('fa-solid fa-check');
  });

  // ── multiple chips ────────────────────────────────────────────────────────

  it('renders all three kinds in a single list', () => {
    const wrapper = mountComponent([
      { kind: 'easy', count: 500, label: 'light ops' },
      { kind: 'hard', count: 50, label: 'heavy ops' },
      { kind: 'feature', count: 3, label: 'integrations' },
    ]);
    const chips = wrapper.findAllComponents({ name: 'VChip' });
    expect(chips).toHaveLength(3);
    expect(wrapper.text()).toContain('500');
    expect(wrapper.text()).toContain('50');
    expect(wrapper.text()).toContain('3');
  });

  // ── a11y ────────────────────────────────────────────────────────────────

  it('has role=list on the wrapper and role=listitem on each chip', () => {
    const wrapper = mountComponent([
      { kind: 'easy', count: 100, label: 'ops' },
    ]);
    expect(wrapper.attributes('role')).toBe('list');
    const chipEl = wrapper.find('[role="listitem"]');
    expect(chipEl.exists()).toBe(true);
  });
});
