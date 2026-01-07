// Setup file for Vitest
import { config } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';

// Create a new Pinia instance for each test
setActivePinia(createPinia());

// Mock global config
config.global.mocks = {
  config: {
    app: {
      title: 'WAOS',
    },
  },
};

// Add any global test setup here
