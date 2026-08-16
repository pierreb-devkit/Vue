import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCaptureFirstTouch = vi.fn();
vi.mock('../../helpers/attribution', () => ({
  captureFirstTouch: (...args) => mockCaptureFirstTouch(...args),
}));

import attributionPlugin from '../attribution';

describe('attribution plugin', () => {
  beforeEach(() => {
    mockCaptureFirstTouch.mockClear();
  });

  it('has an install method', () => {
    expect(typeof attributionPlugin.install).toBe('function');
  });

  it('calls captureFirstTouch on install', () => {
    attributionPlugin.install();
    expect(mockCaptureFirstTouch).toHaveBeenCalledOnce();
  });
});
