import { join } from 'node:path';
import { describe, it, expect, vi } from 'vitest';
import { prerenderPlugin, sanitizePath, routeToOutputPath } from '../prerender.js';

describe('prerenderPlugin', () => {
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
    // Should return immediately without error
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

  it('logs warning and continues when puppeteer import fails', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const plugin = prerenderPlugin(
      { app: { seo: { prerender: { enabled: true, routes: ['/'] } } } },
      'production',
    );
    await plugin.closeBundle();

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[prerender] Pre-rendering failed'),
      expect.any(String),
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

  it('maps "/docs/intro" to dist/docs/intro/index.html', () => {
    expect(routeToOutputPath(distDir, '/docs/intro')).toBe(
      join(distDir, 'docs', 'intro', 'index.html'),
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
