import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('aos', () => ({
  default: { init: vi.fn() },
}));

import AOS from 'aos';
import aos from '../aos';

describe('aos plugin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('has an install method', () => {
    expect(typeof aos.install).toBe('function');
  });

  it('calls AOS.init() on install', () => {
    aos.install();
    expect(AOS.init).toHaveBeenCalledOnce();
  });
});
