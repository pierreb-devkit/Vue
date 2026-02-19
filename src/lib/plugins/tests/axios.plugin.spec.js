import { describe, it, expect } from 'vitest';
import axiosPlugin from '../axios';

describe('axios plugin', () => {
  it('has an install method', () => {
    expect(typeof axiosPlugin.install).toBe('function');
  });

  it('exposes axios on globalProperties', () => {
    const app = { config: { globalProperties: {} } };
    axiosPlugin.install(app);
    expect(app.config.globalProperties.axios).toBeDefined();
  });

  it('exposes the same axios instance on every install call', () => {
    const app1 = { config: { globalProperties: {} } };
    const app2 = { config: { globalProperties: {} } };
    axiosPlugin.install(app1);
    axiosPlugin.install(app2);
    expect(app1.config.globalProperties.axios).toBe(app2.config.globalProperties.axios);
  });
});
