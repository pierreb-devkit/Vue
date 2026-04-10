import { join } from 'node:path';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.hoisted runs before vi.mock hoisting — safe to reference in factories
const { mockPage, mockBrowser, mockCreateServer } = vi.hoisted(() => {
  const mockPage = {
    goto: vi.fn().mockResolvedValue(undefined),
    content: vi.fn().mockResolvedValue('<html><body>rendered</body></html>'),
    close: vi.fn().mockResolvedValue(undefined),
  };
  const mockBrowser = {
    newPage: vi.fn().mockResolvedValue(mockPage),
    close: vi.fn().mockResolvedValue(undefined),
  };
  const mockCreateServer = vi.fn(() => ({
    listen: vi.fn((_port, _host, cb) => cb()),
    address: vi.fn(() => ({ port: 54321 })),
    close: vi.fn((cb) => cb()),
    on: vi.fn(),
  }));
  return { mockPage, mockBrowser, mockCreateServer };
});

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    default: { ...actual, writeFileSync: vi.fn(), mkdirSync: vi.fn(), readFileSync: vi.fn(() => '<html></html>') },
    ...actual,
    writeFileSync: vi.fn(),
    mkdirSync: vi.fn(),
    readFileSync: vi.fn(() => '<html></html>'),
  };
});

vi.mock('puppeteer', () => ({
  default: { launch: vi.fn().mockResolvedValue(mockBrowser) },
}));

vi.mock('node:http', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    default: { ...actual, createServer: mockCreateServer },
    ...actual,
    createServer: mockCreateServer,
  };
});

import { prerenderPlugin, sanitizePath, routeToOutputPath } from '../prerender.js';

describe('prerenderPlugin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPage.goto.mockResolvedValue(undefined);
    mockPage.content.mockResolvedValue('<html><body>rendered</body></html>');
    mockPage.close.mockResolvedValue(undefined);
    mockBrowser.newPage.mockResolvedValue(mockPage);
    mockBrowser.close.mockResolvedValue(undefined);
  });

  it('returns a vite plugin with correct name', () => {
    const plugin = prerenderPlugin({}, 'development');
    expect(plugin.name).toBe('prerender');
    expect(plugin.apply).toBe('build');
    expect(typeof plugin.closeBundle).toBe('function');
  });

  it('is a no-op when mode is not production', async () => {
    const plugin = prerenderPlugin(
      { app: { seo: { prerender: { enabled: true, routes: ['/'] } } } },
      'development',
    );
    await plugin.closeBundle();
  });

  it('is a no-op when prerender is disabled', async () => {
    const plugin = prerenderPlugin(
      { app: { seo: { prerender: { enabled: false, routes: ['/'] } } } },
      'production',
    );
    await plugin.closeBundle();
  });

  it('is a no-op when config is empty', async () => {
    const plugin = prerenderPlugin({}, 'production');
    await plugin.closeBundle();
  });

  it('is a no-op when routes array is empty', async () => {
    const plugin = prerenderPlugin(
      { app: { seo: { prerender: { enabled: true, routes: [] } } } },
      'production',
    );
    await plugin.closeBundle();
  });

  it('renders routes and closes browser/server on success', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const plugin = prerenderPlugin(
      { app: { seo: { prerender: { enabled: true, routes: ['/', '/about'] } } } },
      'production',
    );

    await plugin.closeBundle();

    expect(mockBrowser.newPage).toHaveBeenCalledTimes(2);
    expect(mockPage.goto).toHaveBeenCalledTimes(2);
    expect(mockPage.content).toHaveBeenCalledTimes(2);
    expect(mockPage.close).toHaveBeenCalledTimes(2);
    expect(mockBrowser.close).toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('[prerender] Successfully pre-rendered 2 route(s)'),
    );
    logSpy.mockRestore();
  });

  it('closes page in finally block even when goto throws', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    mockPage.goto.mockRejectedValue(new Error('Navigation timeout'));

    const plugin = prerenderPlugin(
      { app: { seo: { prerender: { enabled: true, routes: ['/'] } } } },
      'production',
    );

    await plugin.closeBundle();

    // page.close is called via finally block despite goto failure
    expect(mockPage.close).toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[prerender] Failed to pre-render route "/"'),
      'Navigation timeout',
    );
    warnSpy.mockRestore();
    logSpy.mockRestore();
  });

  it('logs warning when puppeteer launch fails', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const puppeteer = await import('puppeteer');
    puppeteer.default.launch.mockRejectedValueOnce(new Error('No chromium'));

    const plugin = prerenderPlugin(
      { app: { seo: { prerender: { enabled: true, routes: ['/'] } } } },
      'production',
    );

    await plugin.closeBundle();

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[prerender] Pre-rendering failed'),
      'No chromium',
    );
    warnSpy.mockRestore();
  });
});

describe('sanitizePath', () => {
  it('strips leading slashes', () => {
    expect(sanitizePath('/assets/app.js')).toBe('assets/app.js');
  });

  it('strips multiple leading slashes', () => {
    expect(sanitizePath('///foo/bar')).toBe('foo/bar');
  });

  it('removes ".." segments to prevent traversal', () => {
    expect(sanitizePath('/../etc/passwd')).toBe('etc/passwd');
  });

  it('removes ".." segments in the middle', () => {
    expect(sanitizePath('/foo/../bar')).toBe('foo/bar');
  });

  it('handles root path', () => {
    expect(sanitizePath('/')).toBe('');
  });

  it('handles empty string', () => {
    expect(sanitizePath('')).toBe('');
  });

  it('handles path without leading slash', () => {
    expect(sanitizePath('assets/app.js')).toBe('assets/app.js');
  });

  it('filters empty segments from double slashes', () => {
    expect(sanitizePath('/foo//bar')).toBe('foo/bar');
  });
});

describe('routeToOutputPath', () => {
  const distDir = '/project/dist';

  it('maps "/" to dist/index.html', () => {
    expect(routeToOutputPath(distDir, '/')).toBe(join(distDir, 'index.html'));
  });

  it('maps "/about" to dist/about/index.html', () => {
    expect(routeToOutputPath(distDir, '/about')).toBe(join(distDir, 'about', 'index.html'));
  });

  it('maps "/blog/intro" to dist/blog/intro/index.html', () => {
    expect(routeToOutputPath(distDir, '/blog/intro')).toBe(
      join(distDir, 'blog', 'intro', 'index.html'),
    );
  });

  it('prevents path traversal with ".."', () => {
    const result = routeToOutputPath(distDir, '/../etc');
    expect(result).toBe(join(distDir, 'etc', 'index.html'));
    expect(result.startsWith(join(distDir))).toBe(true);
  });

  it('handles empty route as root', () => {
    expect(routeToOutputPath(distDir, '')).toBe(join(distDir, 'index.html'));
  });
});
