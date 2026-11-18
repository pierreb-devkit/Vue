import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { h } from 'vue';
import { VCard } from 'vuetify/components';
import vuetify from '../vuetify';

describe('vuetify plugin', () => {
  it('exports a vuetify instance', () => {
    expect(vuetify).toBeDefined();
  });

  it('has an install method (valid Vue plugin)', () => {
    expect(typeof vuetify.install).toBe('function');
  });

  it('gives every card the configured flat look and radius', () => {
    const wrapper = mount({ render: () => h(VCard) }, { global: { plugins: [vuetify] } });
    const classes = wrapper.find('.v-card').classes();
    expect(classes).toContain('v-card--flat');
    expect(classes).toContain('rounded-lg');
  });
});
