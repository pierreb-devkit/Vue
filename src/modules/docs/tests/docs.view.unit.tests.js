import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

// Mock @scalar/api-reference
vi.mock('@scalar/api-reference', () => ({
  ApiReference: {
    name: 'ApiReference',
    props: ['configuration'],
    template: '<div class="scalar-api-reference" />',
  },
}));

// Mock config
vi.mock('../../../lib/services/config', () => ({
  default: {
    api: {
      protocol: 'http',
      host: 'localhost',
      port: '3000',
      base: 'api',
    },
  },
}));

import DocsView from '../views/docs.view.vue';

describe('Docs View', () => {
  let vuetify;

  beforeEach(() => {
    vuetify = createVuetify({ components, directives });
    vi.clearAllMocks();
  });

  const mountView = () => mount(DocsView, {
    global: {
      plugins: [vuetify],
    },
  });

  it('should render the Scalar ApiReference component', () => {
    const wrapper = mountView();
    const scalar = wrapper.findComponent({ name: 'ApiReference' });
    expect(scalar.exists()).toBe(true);
  });

  it('should pass configuration with spec URL to ApiReference', () => {
    const wrapper = mountView();
    const scalar = wrapper.findComponent({ name: 'ApiReference' });
    const conf = scalar.props('configuration');
    expect(conf.url).toBe('http://localhost:3000/api/spec.json');
    expect(conf.theme).toBe('default');
  });

  it('should render within a fluid container', () => {
    const wrapper = mountView();
    const container = wrapper.find('.v-container');
    expect(container.exists()).toBe(true);
  });
});
